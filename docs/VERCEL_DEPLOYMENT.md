# Vercel Deployment

Production URL: <https://agentrail-stellar.vercel.app>

The production frontend is deployed by the `deploy-frontend` job in
`.github/workflows/ci.yml`. The job runs only for `main` pushes or a manual
workflow dispatch from `main`, and only after both frontend and contract quality
jobs pass. Vercel detects the Vite framework from `vercel.json`.

## One-time CI/CD setup

1. Create or link the `agentrail-stellar` project in Vercel.
2. Read `orgId` and `projectId` from the generated `.vercel/project.json` file.
3. Create a Vercel access token.
4. Add these GitHub Actions repository or `production` environment secrets:

   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

5. Add the application variables below to the Vercel Production environment.
6. Push to `main`, or run the `Quality gate` workflow manually from `main`.

The deployment job records the resulting URL on the GitHub production
environment and in the workflow summary. Native Vercel Git deployments are
disabled by `git.deploymentEnabled: false` in `vercel.json`, so GitHub Actions
is the single production deployment path.

## Environment variables

Add these variables to **Production**, **Preview**, and **Development**:

```dotenv
VITE_AGENTRAIL_CONTRACT_ID=CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_NATIVE_TOKEN_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
VITE_TESTNET_USDC_CONTRACT_ID=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
VITE_AGENTRAIL_READ_SOURCE=GBRTZ4TDJDBMR3Y3S3IAFEQFFW2YGRR35XOPRMHGFRKFGY4PMOU45T3N
VITE_ENABLE_DEMO_MODE=false
VITE_SENTRY_DSN=
VITE_APP_VERSION=0.4.0
OPENAI_API_KEY=your-server-only-openai-key
OPENAI_MODEL=gpt-5.6-luna
FEEDBACK_WEBHOOK_URL=
```

`VITE_SENTRY_DSN` is optional. Leave it empty until a Sentry browser project is
created, then paste its public DSN. `FEEDBACK_WEBHOOK_URL` is optional and should
point to a private collector that accepts JSON POST requests.

`OPENAI_API_KEY` and `FEEDBACK_WEBHOOK_URL` are server-only secrets. Never add a
`VITE_` prefix to them. Every `VITE_` value is embedded in the browser bundle;
never put a private key, Stellar secret seed, API secret, or administrator
credential in those variables.

## Vercel settings

- Framework preset: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 22.x

After the first successful CD run, enable Vercel Web Analytics in the project
dashboard. The app already includes `@vercel/analytics`. Then test:

1. `/api/copilot` through the Mission Copilot screen.
2. Contract state loading on Command Center.
3. Freighter Testnet connection.
4. One complete escrow transaction.
5. Feedback submission and export.

Add the final deployment URL to README only after all checks pass.
