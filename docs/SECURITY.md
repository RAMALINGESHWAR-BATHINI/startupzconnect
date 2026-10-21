# StartupzConnect — Security Audit (Consolidation)

This document records the secret and data-hygiene audit performed while consolidating every historical
version of StartupzConnect into a single public repository. It lists what was found, what was done about it,
and what still requires the repository owner's action.

**No secret value appears in this document.** Findings are described by shape, location and status only.

---

## 1. Scope

Every artefact in the workspace was audited:

| Location | Contents |
|----------|----------|
| `versions/v0` … `versions/v5` | All historical application versions. |
| `versions/fixed` | The parallel hardening branch. |
| `versions/admin-foundation` | The standalone admin/security library. |
| `startupzconnect-v5.1` | The v5.1 base used to rebuild the release candidate. |
| `startupzconnect` | The consolidated release candidate. |
| The live GitHub repository | The published tree and its commit history. |

Checks performed:

- Enumeration of every `.env*` file, with values classified as *empty*, *placeholder* or *concrete* without
  being printed.
- Pattern scan of every text file for API keys, bearer tokens, private keys, JWTs, hardcoded password
  literals, high-entropy hex and base64 strings.
- Full dump of every SQLite database, with password hashes, refresh tokens and verification tokens redacted
  before display.
- Verification of whether the refresh tokens found in the published database still validate against the local
  signing secrets.
- Enumeration of every commit on every branch and tag, checking for database files and environment files.

---

## 2. Findings

### F-1 — `prisma/dev.db` was committed to the public repository  *(severity: high)*

The published repository contained `prisma/dev.db`, a SQLite database with **two user rows** carrying:

- e-mail addresses,
- bcrypt password hashes,
- live 137-character refresh tokens,
- (in the release candidate) e-mail verification tokens and the owner account's real e-mail address.

The published rows were two seeded test accounts. The release candidate additionally contained the owner's
own account. The affected e-mail addresses are deliberately **not** reproduced in this public document —
they are recorded in the local `prisma/dev.db` and in the seeded test data, and can be recovered from
either.

**Assessment.** The published refresh tokens were checked against every signing secret found in the
workspace. **None of them validated**, which means the deployed instance was using a different
`REFRESH_TOKEN_SECRET` from the one stored locally. The tokens were therefore not usable against the live
deployment — but a leaked, unexpired bearer credential must still be treated as compromised, and the
password hashes remain subject to offline cracking.

**Remediation applied.** `prisma/dev.db` was removed from **every commit on every branch and tag** in the
consolidated history. The seven original v1 commits were rebuilt with their original author, date, message
and tree — minus that one file — so the recorded history is honest while the data is gone.

The file remains recoverable from the live GitHub repository's pre-consolidation objects until that history
is garbage-collected. See [Owner action](#4-owner-action-required).

### F-2 — One shared signing-secret pair across all six local `.env.local` files  *(severity: medium)*

Every `.env.local` in the workspace contained the **same** 64-character `ACCESS_TOKEN_SECRET` and
`REFRESH_TOKEN_SECRET` pair.

**Assessment.** Reusing one signing key across every version means a single leak compromises all of them,
and rotation requires changing it everywhere at once. It also means any environment provisioned from these
files shares one blast radius.

**Remediation applied.** Every `.env.local` in the workspace — seven files across all versions — was
re-keyed with a freshly generated, unique 64-byte `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` pair.
The old values were removed from every file and verified absent. A token signed with the new secret was
confirmed to verify under the new key and to be **rejected** by the old one.

The rotation is local only. Any **deployed** environment (Cloudflare Workers secrets) must still be
rotated by hand — see [Owner action](#4-owner-action-required).

### F-3 — `.env.local` files present in the workspace  *(severity: low — correctly ignored)*

Six `.env.local` files existed, each holding the real signing secrets.

**Remediation applied.** The rewritten `.gitignore` ignores `.env*` and explicitly re-includes only
`.env.example`. A verification pass confirms that **no** commit on **any** branch or tag contains an
environment file other than the sanitised `.env.example`.

### F-4 — `.env.example` contained real-looking infrastructure values  *(severity: low)*

The previous `.env.example` shipped with `R2_BUCKET_NAME` — a variable name the code does not read — while
omitting `R2_PUBLIC_BUCKET_NAME` and `R2_PRIVATE_BUCKET_NAME`, which it does read. It also omitted
`TURNSTILE_SECRET_KEY` entirely. The bucket names, custom asset hostname and the `RESEND_FROM_EMAIL` /
`ADMIN_EMAIL` values were concrete rather than placeholders.

**Remediation applied.** `.env.example` was rewritten. Every value is now an unambiguous placeholder, every
variable the code actually reads is documented, and the two naming errors are fixed. The full variable
reference now lives in [`ENV-VARS.md`](ENV-VARS.md).

### F-5 — Cloudflare infrastructure identifiers are public  *(severity: informational)*

`wrangler.jsonc` contains the real Cloudflare D1 `database_id`, the `database_name` and the deployed
`pages.dev` hostname. These are identifiers, not credentials — but a `database_id` is only useful to an
attacker who also holds a Cloudflare API token, and none is present.

**Remediation applied.** Left in place deliberately, because the file is useless without a matching API
token and removing the identifiers would break the documented deployment workflow. The identifier is
documented here so the risk is recorded rather than hidden.

### F-6 — Public `ADMIN_PASSWORD` placeholder  *(severity: none)*

The `.env.example` admin password contains the words "strong" and "password". It was checked against every
bcrypt hash in every database in the workspace: **no match**. It is a placeholder, not a credential.

### F-7 — Test fixtures  *(severity: none)*

The source scan flagged `password: 'hunter2'` in `src/lib/__tests__/redact.test.ts`. This is an intentional
fixture for the redaction test, asserting that secret-looking values are replaced before serialisation.

### F-8 — No other secrets found  *(severity: none)*

The full source scan across every version produced no other credential-shaped hits. All remaining matches
were `package-lock.json` integrity hashes, README URLs, and the fixture in F-7.

---

## 3. Verification performed

| Check | Result |
|-------|--------|
| Every commit on every branch and tag scanned for `prisma/dev.db` | **Absent** from all of them. |
| Every commit on every branch and tag scanned for environment files | Only `.env.example` (placeholders only). |
| Every branch and tag scanned for `.db`, `.tsbuildinfo`, `node_modules` | **Absent** from all of them. |
| **All 958 objects reachable from the refs to be pushed enumerated, and all 526 blobs searched for the literal secret values** (the signing keys, every bcrypt hash, every refresh/verification token and every e-mail address found in the local `.env.local` files and SQLite databases) | **No secret value occurs in any object that would be uploaded.** |
| Refresh tokens from the published database tested against all local secrets | **None validated** — the deployment used a different key. |
| `.env.example` admin password tested against every bcrypt hash in the workspace | **No match.** |
| Pattern scan for API keys, tokens, private keys, JWTs, hardcoded credentials across all versions | **No real secrets found.** |
| Post-rotation check: old signing keys present in any `.env.local` | **Zero.** New key signs; old key rejects the new key's tokens. |

Two scripts in the repository re-assert the invariants on every change:

```bash
npm run security:check
npm run verify:consent
```

---

## 4. Owner action required

These cannot be fixed from inside the repository and remain outstanding:

1. **Rotate the deployed environment's signing secrets.** The local `.env.local` files have already been
   re-keyed, but a live deployment keeps its own copy in Cloudflare Workers secrets. Generate two new,
   different 64-byte values, update the deployment environment, and redeploy. Rotating
   `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` invalidates every issued access and refresh token —
   which is the correct outcome here, and is also what removes the published tokens from the risk set
   entirely.

2. **Delete the personal data from the live repository's history.** The pre-consolidation objects still
   contain `prisma/dev.db`. GitHub keeps unreferenced objects reachable for a period after a force-push and
   continues to serve them to anyone holding the old commit SHA. Ask GitHub Support to garbage-collect the
   orphaned objects, and treat the two published passwords as compromised and reset them.

3. **Reset the affected accounts.** The two seeded test accounts had their bcrypt hashes published, and the
   owner's own account was present in the release candidate's database. Reset or invalidate all three.
   The addresses are in the local `prisma/dev.db`.

4. **Remove the owner's real e-mail address from any remaining copy.** The release candidate's
   `prisma/dev.db` contained it, along with e-mail verification tokens. The file is excluded from the
   consolidated history, but any local copy or prior deployment artefact should be checked.

5. **Rotate the Cloudflare R2 credentials and D1 binding if the workspace was ever shared.** No Cloudflare
   API token was found in the audit, but the D1 `database_id` is public.

6. **Adopt per-environment secrets going forward.** Every environment — development, staging, production —
   should have its own generated signing pair rather than sharing one, as was the case across the six
   `.env.local` files found here.

---

## 5. Reporting a vulnerability

Please report security issues privately to the repository owner rather than opening a public issue. Include
reproduction steps and the affected version or branch.
