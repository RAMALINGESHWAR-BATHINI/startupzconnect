# StartupzConnect — Testing

## Test Suite (Vitest)
| File | Tests | Coverage |
|------|-------|----------|
| jwt-security.test.ts | 8 | HS256 pinning, alg:none rejection, wrong secret, expired, tampered, purpose mismatch |
| url-safety.test.ts | 6 | URL safety checks |
| file-signature.test.ts | 11 | Magic-byte MIME verification, spoof rejection |
| tokens.test.ts | 3 | Token generation |
| badges.test.ts | 9 | Badge logic |
| permissions.test.ts | 7 | Permission registry, deny-by-default |
| approval-policy.test.ts | 6 | Approval decisions, no self-approval, no replay |

## Running Tests
```
npm install
npx vitest run
```

## Database-Backed Integration Tests (to be added)
Run against an isolated test database (never production):
- IDOR cross-startup team deletion
- Investor access to inspection reports
- Permission enforcement per role
- Role revocation and last GLOBAL_ADMIN protection
- Approval workflows (no self-approval, no replay)
- Invalid JWTs (alg:none, wrong secret, expired, tampered)
- Session invalidation (password change, refresh reuse)
- CSRF rejection on unsafe methods
- Upload spoofing (wrong MIME vs magic bytes)
- Signed URL expiry (5 minutes)
- Rate limits (login, register, forgot-password)
- Concurrent inspection submissions
- Audit protection (UPDATE/DELETE refused by triggers)

## Static Security Checks
`scripts/security-check.mjs` checks for:
- Hardcoded secrets
- `dangerouslySetInnerHTML`
- Raw SQL
- Public URLs for sensitive documents
- `.env` files in git