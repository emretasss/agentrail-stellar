# Vercel Deployment

Import `github.com/emretasss/agentrail-stellar` into Vercel. Vercel detects the
Vite framework from `vercel.json`.

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
VITE_APP_VERSION=0.3.0
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

After deployment, enable Vercel Web Analytics in the project dashboard. The app
already includes `@vercel/analytics`. Then test:

1. `/api/copilot` through the Mission Copilot screen.
2. Contract state loading on Command Center.
3. Freighter Testnet connection.
4. One complete escrow transaction.
5. Feedback submission and export.

Add the final deployment URL to README only after all checks pass.
