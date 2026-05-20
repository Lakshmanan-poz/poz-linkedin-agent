# POZ Social Media Agent — AWS Deployment Documentation

**Project:** POZ Social Media Agent  
**Owner:** Lakshmanan (lakshmanan@pointonezero.com)  
**AWS Account:** 321213587646 (Point One Zero)  
**Admin:** Migavel (migavel@pointonezero.com)  
**Region:** us-east-1  
**Deployed:** 2026-05-20

---

## Architecture Overview

```
Browser
   │
   ▼
Vercel (frontend — pages, UI components)
   │
   │  next.config.ts rewrite: /api/* → Lambda
   │
   ▼
AWS API Gateway
https://ypg368g0ai.execute-api.us-east-1.amazonaws.com
   │
   ▼
AWS Lambda: poz-social-api
(Next.js standalone — all API routes)
   │
   ├──► Supabase PostgreSQL (posts, team, auth, files)
   │
   └──► AWS Secrets Manager
        /poz-social-media-agent/claude-api-key
              │
              ▼
        Anthropic Claude API
        (carousel HTML generation)
```

---

## AWS Resources Created

| Resource | Name / ID | Purpose |
|---|---|---|
| Lambda Function | `poz-social-api` | Runs all Next.js API routes |
| API Gateway | `poz-social` / `ypg368g0ai` | Public HTTPS endpoint for Lambda |
| ECR Repository | `poz-social-agent` | Docker image registry |
| IAM Role | `poz-social-lambda-role` | Lambda execution role |
| IAM User | `lakshmanan-poz` | Developer — deploy/dev access only |
| IAM Policy | `Policy-POZSocialMedia-DenySecrets` | Blocks lakshmanan from reading secrets |
| Secrets Manager Secret | `/poz-social-media-agent/claude-api-key` | Claude API key (encrypted) |
| CloudTrail | `poz-secrets-audit-trail` | Audit log of all secret access |
| CloudWatch Alarm | `POZ-SecretsUnauthorizedAccess` | Fires on any denied secret access |
| CloudWatch Alarm | `POZ-SecretsMutation` | Fires on key change or deletion |
| CloudWatch Alarm | `POZ-SecretsHighReadVolume` | Fires on >30 reads in 5 minutes |
| SNS Topic | `poz-secrets-access-alerts` | Email alerts to migavel@pointonezero.com |

---

## Lambda Configuration

| Setting | Value |
|---|---|
| Function name | `poz-social-api` |
| Runtime | Docker image (Node.js 20 + Next.js standalone) |
| Architecture | x86_64 |
| Memory | 1024 MB |
| Timeout | 30 seconds |
| Image registry | `321213587646.dkr.ecr.us-east-1.amazonaws.com/poz-social-agent` |

### Environment Variables on Lambda

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SECRET_KEY` | Supabase service role key |
| `JWT_SECRET` | Session token signing secret |
| `OPENAI_API_KEY` | OpenAI GPT-4o key |
| `XAI_API_KEY` | Grok / xAI key for trend search |
| `E2B_API_KEY` | E2B sandbox key |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `ANTHROPIC_API_KEY` | **NOT SET** — fetched from Secrets Manager at runtime |

---

## Claude API Key — Security Model

The Anthropic Claude API key is **never stored in any file, environment variable, or code**. It is stored exclusively in AWS Secrets Manager and fetched at Lambda cold start using the attached IAM role.

### How it works at runtime

```
1. Lambda receives a request to /api/agents/carousel-html
2. getClaudeApiKey() is called (src/lib/claude-secrets.ts)
3. AWS SDK uses poz-social-lambda-role (auto-injected by Lambda runtime)
4. Calls Secrets Manager: GetSecretValue /poz-social-media-agent/claude-api-key
5. Key returned in memory, cached for container lifetime
6. Anthropic client initialised with the key
7. Key never written to logs, files, or HTTP responses
```

### Who can read the key

| Principal | Access | Reason |
|---|---|---|
| `poz-social-lambda-role` | ✅ Allowed | Runtime role — only way key is used |
| `migavel@pointonezero.com` (admin) | ✅ Allowed | AWS account admin |
| `lakshmanan-poz` (developer) | ❌ explicitDeny | `Policy-POZSocialMedia-DenySecrets` |
| Anyone else | ❌ Denied | Not in Secrets Manager resource policy |

### Key location audit

| Location | Status |
|---|---|
| `.env` file | Removed — replaced with a comment |
| Vercel environment variables | Must be deleted from Vercel dashboard |
| Lambda environment variables | Never set |
| Git / source code | Never committed |
| AWS Secrets Manager | ✅ Only location |

---

## API Routes Deployed on Lambda

All routes under `/api/*` run on Lambda. The Vercel frontend proxies them via `next.config.ts` rewrites.

| Route Group | Endpoints |
|---|---|
| `/api/agents/` | `carousel-html`, `carousel-design`, `carousel-refine`, `generate`, `chat`, `chat-history`, `rag`, `upload`, `trending`, `outputs` |
| `/api/auth/` | `login`, `logout`, `session` |
| `/api/posts/` | CRUD, `status`, `comments`, `revisions`, `quick-publish` |
| `/api/team/` | list, create, update, delete |
| `/api/notifications/` | list, mark read, read-all |
| `/api/calendar` | calendar view |
| `/api/dashboard/stats` | dashboard metrics |
| `/api/settings` | app settings |
| `/api/share/` | shared session links |
| `/api/generate` | post generation |
| `/api/admin/cleanup` | admin maintenance |

---

## Frontend → Backend Connection

In `next.config.ts`, a rewrite rule proxies all API calls from Vercel to Lambda:

```typescript
async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: "https://ypg368g0ai.execute-api.us-east-1.amazonaws.com/api/:path*",
    },
  ];
}
```

This means:
- The browser calls `/api/agents/carousel-html` on the Vercel domain
- Vercel's server forwards it to the Lambda URL
- The browser **never directly contacts Lambda** — Lambda URL is abstracted away
- No CORS issues — the request appears same-origin to the browser

---

## IAM User — Lakshmanan (Developer)

| Detail | Value |
|---|---|
| IAM Username | `lakshmanan-poz` |
| AWS Access Key ID | `AKIAUVSOSMC7IJBFKAAP` |
| Policies | `Policy-POZSocialMedia-DenySecrets` (explicit deny on all Secrets Manager) |
| Can read Claude API key | ❌ No — explicitly denied |
| Purpose | Development work, not deployment or secret access |

**Share credentials via password manager only — never Slack or email.**

---

## Deploying Updates

To redeploy the backend after code changes:

```bash
cd poz-social-agent
bash deploy.sh
```

The script will:
1. Build a new Docker image from the latest code
2. Push to ECR
3. Update the Lambda function
4. Re-apply the IAM Secrets Manager policy
5. Update the Secrets Manager resource policy

**No need to pass `ANTHROPIC_API_KEY`** — it is never part of the deploy process.

### Prerequisites for deploy

- Docker running locally
- AWS CLI configured with admin credentials (`migavel@pointonezero.com`)
- `.env` file present with all non-Claude env vars

---

## Rotating the Claude API Key

When you need to rotate the key:

1. Get the new key from Anthropic console
2. Update Secrets Manager only:

```bash
aws secretsmanager update-secret \
  --secret-id "/poz-social-media-agent/claude-api-key" \
  --secret-string '{"api_key":"sk-ant-NEW_KEY_HERE"}' \
  --region us-east-1
```

3. The Lambda picks it up automatically on the next cold start — **no redeploy needed**
4. CloudWatch alarm `POZ-SecretsMutation` will fire — check your email at migavel@pointonezero.com to confirm it was you

---

## Monitoring & Alerts

All secret access is logged via CloudTrail → CloudWatch. Three alarms are active, all alerting to `migavel@pointonezero.com`:

| Alarm | Trigger | Severity |
|---|---|---|
| `POZ-SecretsUnauthorizedAccess` | Any `AccessDenied` on the secret | Critical — immediate |
| `POZ-SecretsMutation` | Key updated, rotated, or deleted | Critical — immediate |
| `POZ-SecretsHighReadVolume` | >30 reads in 5 minutes | Warning — possible extraction attempt |

---

## Files Added to Repository

| File | Purpose |
|---|---|
| `src/lib/claude-secrets.ts` | Fetches Claude API key from Secrets Manager at runtime |
| `Dockerfile.lambda` | Builds Next.js standalone image for Lambda Web Adapter |
| `deploy.sh` | Full deploy script — ECR, Lambda, API Gateway, IAM, Secrets Manager |
| `next.config.ts` | Added `output: standalone` and Vercel → Lambda rewrite |
| `AWS_DEPLOYMENT.md` | This file |
