This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/migavel-poz/POZ-Agent.git
cd POZ-Agent
```

2. Install dependencies:
```bash
npm install
```

### Running the Development Server

The development server runs on port 3000 by default. 

**Start the development server:**

```bash
npm run dev
```

If you encounter the error `EADDRINUSE: address already in use :::3000`, port 3000 is already occupied. Choose one of these options:

**Option 1: Use a different port**
```bash
npx next dev --port 3001
```

**Option 2: Kill the process using port 3000 (Windows PowerShell)**
```powershell
$processId = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess
if ($processId) { 
  Stop-Process -Id $processId -Force
  Write-Host "Killed process $processId. Try 'npm run dev' again."
}
```

**Option 3: Create a custom npm script (edit package.json)**
Add this to your `package.json` scripts for a specific port:
```json
"dev:3001": "cross-env PORT=3001 next dev --port 3001"
```
Then run: `npm run dev:3001`

Open [http://localhost:3000](http://localhost:3000) (or your chosen port) with your browser to see the result.

> **Note**: The development script uses `cross-env` for cross-platform compatibility between Windows and Unix-like systems.

## Environment

Create `.env` from `.env.example` and set:

- `DATABASE_URL` for migrations
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for public Supabase access
- `OPENAI_API_KEY` for AI features

Run migrations with:

```bash
npm run db:migrate
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
