# Deploy — food-plan-next (Vercel)

Next.js deploys to [Vercel](https://vercel.com) with zero config.

## Steps

1. Push this repo to GitHub (already done: `katseliak-lab/food-plan-next`).
2. In Vercel: **Add New → Project**, import the repo. Vercel auto-detects Next.js.
3. Add environment variables (Project → Settings → Environment Variables):

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | your Render backend, e.g. `https://recipe-ai-api.onrender.com/api` |
   | `NEXT_PUBLIC_FIREBASE_*` | (optional) the six Firebase values, to enable Firebase cloud sync |

4. **Deploy.** You get a URL like `https://food-plan-next.vercel.app`.
5. Back in the **backend** (Render), set `CORS_ORIGINS` to this exact Vercel URL and redeploy, so the browser is allowed to call the API.

## Order of operations

Deploy the [backend](https://github.com/katseliak-lab/recipe-ai-api) first (you
need its URL for `NEXT_PUBLIC_API_URL`), then this frontend, then set the
backend's `CORS_ORIGINS` to the Vercel URL.

Without `NEXT_PUBLIC_API_URL` the app still runs — it falls back to the manual
"paste JSON" flow and localStorage; only server-side AI generation needs the API.
