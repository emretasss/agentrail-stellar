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
VITE_APP_VERSION=0.2.0
```

`VITE_SENTRY_DSN` is optional. Leave it empty until a Sentry browser project is
created, then paste its public DSN. Every `VITE_` value is embedded in the
browser bundle; never put a private key, Stellar secret seed, API secret, or
admin credential in these variables.

## Vercel settings

- Framework preset: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 22.x

After deployment, enable Vercel Web Analytics in the project dashboard. The app
already includes `@vercel/analytics`.
