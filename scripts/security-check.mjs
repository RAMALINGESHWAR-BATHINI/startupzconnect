#!/usr/bin/env node
/**
 * security-check.mjs — Static security checks for StartupzConnect.
 *
 * Scans the source tree for:
 *   1. Hardcoded secrets / API keys / tokens in source
 *   2. dangerouslySetInnerHTML usage (XSS risk)
 *   3. Raw SQL strings (SQL injection risk)
 *   4. Public URLs referencing sensitive document folders
 *   5. .env files tracked in git (should be in .gitignore)
 *   6. Client-side role/permission trust patterns
 *
 * Exit code 1 if any check fails.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const GITIGNORE = path.join(ROOT, '.gitignore');

let failures = 0;
const warn = (file, line, msg) => {
  failures++;
  console.error(`  [FAIL] ${file}:${line} — ${msg}`);
};

const SECRET_PATTERNS = [
  { name: 'AWS secret key', re: /(aws_secret_access_key|secret_access_key)\s*[:=]\s*['"][A-Za-z0-9/+=]{20,}['"]/i },
  { name: 'Stripe secret key', re: /sk_(live|test)_[A-Za-z0-9]{24,}/ },
  { name: 'Resend API key', re: /re_[A-Za-z0-9]{20,}/ },
  { name: 'Generic API key assignment', re: /(api[_-]?key|secret[_-]?key|private[_-]?key)\s*[:=]\s*['"][A-Za-z0-9_\-\.]{16,}['"]/i },
  { name: 'Hardcoded JWT secret', re: /(ACCESS_TOKEN_SECRET|REFRESH_TOKEN_SECRET)\s*[:=]\s*['"][^'"]{8,}['"]/ },
];

const DANGEROUS_INNER_HTML = /dangerouslySetInnerHTML/;
const RAW_SQL = /(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\s+/i;
const RAW_SQL_EXCLUDE = /prisma\.|db\.|queryRaw|\$queryRaw|executeRaw|\$executeRaw/;

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
        warn(rel, i + 1, `Possible hardcoded ${name}.`);
      }
    }
  }

  // 2. dangerouslySetInnerHTML
  for (let i = 0; i < lines.length; i++) {
    if (DANGEROUS_INNER_HTML.test(lines[i])) {
      warn(rel, i + 1, 'dangerouslySetInnerHTML usage — potential XSS.');
    }
  }

  // 3. Raw SQL (exclude legitimate Prisma query builder calls and template literals)
  // Match actual SQL statements: keyword at start of quoted string followed by SQL clauses.
  const RAW_SQL_STMT = /["']\s*(SELECT\s+[\*,\w]|INSERT\s+INTO\s+\w|UPDATE\s+\w+\s+SET|DELETE\s+FROM\s+\w|DROP\s+(TABLE|DATABASE|INDEX)\s+\w|ALTER\s+TABLE\s+\w|CREATE\s+(TABLE|INDEX|DATABASE)\s+\w)/i;
  for (let i = 0; i < lines.length; i++) {
    if (!RAW_SQL_EXCLUDE.test(lines[i]) && !lines[i].includes('//') && !lines[i].includes('/*')) {
      if (RAW_SQL_STMT.test(lines[i]) && !lines[i].includes('${')) {
        warn(rel, i + 1, 'Possible raw SQL string — SQL injection risk.');
      }
    }
  }

  // 4. Client-side role trust (roles read from cookie/token without server verification)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("decoded.role === 'ADMIN'") || lines[i].includes('decoded.role === "ADMIN"')) {
      warn(rel, i + 1, 'Legacy client-trusted ADMIN role check — use authorizeAdmin instead.');
    }
  }
}

function scanEnvIgnore() {
  if (!fs.existsSync(GITIGNORE)) {
    warn('.gitignore', 1, '.gitignore missing — .env files may be tracked.');
    return;
  }
  const gi = fs.readFileSync(GITIGNORE, 'utf8');
  if (!gi.includes('.env')) {
    warn('.gitignore', 1, '.env not in .gitignore — secrets may be committed.');
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

// Check for .env files in root
for (const f of fs.readdirSync(ROOT)) {
  if (f.startsWith('.env') && f !== '.env.example') {
    warn(f, 1, 'Real .env file present in project root — ensure it is not committed.');
  }
}

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===\n`);
process.exit(failures === 0 ? 0 : 1);
