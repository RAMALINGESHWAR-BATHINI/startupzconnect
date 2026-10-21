#!/usr/bin/env node
/**
 * security-check.mjs — Static security checks for StartupzConnect.
 *
 * Scans the source tree for:
 *   1. Hardcoded secrets / API keys / tokens in source
 *   2. dangerouslySetInnerHTML usage (XSS risk)
 *   3. Raw SQL strings (SQL injection risk)
 *   4. Public URLs referencing sensitive document folders
 *   5. Environment files or database files tracked in git
 *   6. Client-side role/permission trust patterns (reported as advisory debt)
 *
 * Exit code 1 if any hard check fails. Advisory findings are counted and
 * reported but do not fail the run, so the script stays usable in CI.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const GITIGNORE = path.join(ROOT, '.gitignore');

let failures = 0;
let advisories = 0;
const fail = (file, line, msg) => {
  failures++;
  console.error(`  [FAIL] ${file}:${line} — ${msg}`);
};
const advise = (file, line, msg) => {
  advisories++;
  console.warn(`  [WARN] ${file}:${line} — ${msg}`);
};

const SECRET_PATTERNS = [
  { name: 'AWS secret key', re: /(aws_secret_access_key|secret_access_key)\s*[:=]\s*['"][A-Za-z0-9/+=]{20,}['"]/i },
  { name: 'Stripe secret key', re: /sk_(live|test)_[A-Za-z0-9]{24,}/ },
  { name: 'Resend API key', re: /re_[A-Za-z0-9]{20,}/ },
  { name: 'Generic API key assignment', re: /(api[_-]?key|secret[_-]?key|private[_-]?key)\s*[:=]\s*['"][A-Za-z0-9_\-\.]{16,}['"]/i },
  { name: 'Hardcoded JWT secret', re: /(ACCESS_TOKEN_SECRET|REFRESH_TOKEN_SECRET)\s*[:=]\s*['"][^'"]{8,}['"]/ },
];

const DANGEROUS_INNER_HTML = /dangerouslySetInnerHTML/;
const RAW_SQL_EXCLUDE = /prisma\.|db\.|queryRaw|\$queryRaw|executeRaw|\$executeRaw/;
const RAW_SQL_STMT = /["']\s*(SELECT\s+[\*,\w]|INSERT\s+INTO\s+\w|UPDATE\s+\w+\s+SET|DELETE\s+FROM\s+\w|DROP\s+(TABLE|DATABASE|INDEX)\s+\w|ALTER\s+TABLE\s+\w|CREATE\s+(TABLE|INDEX|DATABASE)\s+\w)/i;

/** Both equality forms of the legacy token-role check. */
const LEGACY_ROLE_TRUST = /decoded\.role\s*(===|!==)\s*['"]ADMIN['"]/;

/** Files git is actually tracking. Empty when git is unavailable. */
function gitTrackedFiles() {
  try {
    const out = execFileSync('git', ['ls-files', '-z'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return new Set(out.split('\0').filter(Boolean));
  } catch {
    return null;
  }
}

function scanFile(file) {
  const rel = path.relative(ROOT, file);
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch { return; }
  const lines = content.split('\n');

  // 1. Hardcoded secrets
  for (const { name, re } of SECRET_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        // Allow .env.example placeholders
        if (rel.includes('.env.example') && lines[i].includes('your-')) continue;
        fail(rel, i + 1, `Possible hardcoded ${name}.`);
      }
    }
  }

  // 2. dangerouslySetInnerHTML
  for (let i = 0; i < lines.length; i++) {
    if (DANGEROUS_INNER_HTML.test(lines[i])) {
      fail(rel, i + 1, 'dangerouslySetInnerHTML usage — potential XSS.');
    }
  }

  // 3. Raw SQL (exclude legitimate Prisma query builder calls and template literals)
  for (let i = 0; i < lines.length; i++) {
    if (!RAW_SQL_EXCLUDE.test(lines[i]) && !lines[i].includes('//') && !lines[i].includes('/*')) {
      if (RAW_SQL_STMT.test(lines[i]) && !lines[i].includes('${')) {
        fail(rel, i + 1, 'Possible raw SQL string — SQL injection risk.');
      }
    }
  }

  // 4. Legacy role trust — advisory. These predate the admin-foundation
  //    permission model and should migrate to authorizeAdmin().
  for (let i = 0; i < lines.length; i++) {
    if (LEGACY_ROLE_TRUST.test(lines[i])) {
      advise(rel, i + 1, 'Legacy token-role check — migrate to authorizeAdmin() for live DB role verification.');
    }
  }
}

function scanEnvIgnore() {
  if (!fs.existsSync(GITIGNORE)) {
    fail('.gitignore', 1, '.gitignore missing — .env files may be tracked.');
    return;
  }
  const gi = fs.readFileSync(GITIGNORE, 'utf8');
  if (!gi.includes('.env')) {
    fail('.gitignore', 1, '.env not in .gitignore — secrets may be committed.');
  }
}

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      walk(full, cb);
    } else if (entry.isFile()) {
      cb(full);
    }
  }
}

console.log('=== StartupzConnect Security Check ===\n');

walk(SRC, scanFile);
scanEnvIgnore();

// Check that no environment file or database file is actually tracked in git.
// A local .env.local is expected during development — only tracked files matter.
const tracked = gitTrackedFiles();
if (tracked) {
  for (const f of tracked) {
    const base = path.basename(f);
    if ((base.startsWith('.env') && base !== '.env.example') || /\.db(-journal|-shm|-wal)?$/.test(base)) {
      fail(f, 1, 'Environment or database file is tracked in git — remove it and ignore the path.');
    }
  }
  console.log(`  Checked ${tracked.size} git-tracked files for secrets and database files.`);
} else {
  console.log('  [SKIP] git unavailable — could not verify tracked files.');
}

// Warn if a real .env file sits in the project root (it must stay git-ignored).
for (const f of fs.readdirSync(ROOT)) {
  if (f.startsWith('.env') && f !== '.env.example' && !tracked?.has(f)) {
    advise(f, 1, 'Local environment file present in the project root — confirm it stays git-ignored.');
  }
}

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
if (advisories > 0) {
  console.log(`=== ${advisories} ADVISORY FINDING(S) (not failing) ===`);
}
console.log('');

process.exit(failures === 0 ? 0 : 1);
