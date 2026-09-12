// Single source of truth for the production URL — layout.tsx (metadata,
// JSON-LD), sitemap.ts, and robots.ts all need it, and hardcoding it in
// three places is exactly the kind of drift this project avoids
// elsewhere (see gameVersion.ts/version.ts for the same reasoning).
export const SITE_URL = "https://enchant-advisor.vercel.app";
