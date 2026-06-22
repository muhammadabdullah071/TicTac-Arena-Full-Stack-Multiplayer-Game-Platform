import { auth } from "./auth.js";

const OAUTH_PROVIDERS = [
  {
    id: "google",
    name: "Google",
    type: "oauth",
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
    authorization: {
      url: "https://accounts.google.com/o/oauth2/v2/auth",
      params: { scope: "openid email profile", prompt: "consent" },
    },
    token: "https://oauth2.googleapis.com/token",
    userinfo: "https://www.googleapis.com/oauth2/v3/userinfo",
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      };
    },
  },
  {
    id: "discord",
    name: "Discord",
    type: "oauth",
    clientId: process.env.AUTH_DISCORD_ID,
    clientSecret: process.env.AUTH_DISCORD_SECRET,
    authorization: {
      url: "https://discord.com/api/oauth2/authorize",
      params: { scope: "identify email" },
    },
    token: "https://discord.com/api/oauth2/token",
    userinfo: "https://discord.com/api/users/@me",
    profile(profile) {
      return {
        id: profile.id,
        name: profile.global_name || profile.username,
        email: profile.email,
        image: profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          : null,
      };
    },
  },
  {
    id: "github",
    name: "GitHub",
    type: "oauth",
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
    authorization: {
      url: "https://github.com/login/oauth/authorize",
      params: { scope: "read:user user:email" },
    },
    token: "https://github.com/login/oauth/access_token",
    userinfo: {
      url: "https://api.github.com/user",
      async request({ tokens, provider }) {
        const headers = { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" };
        const user = await fetch("https://api.github.com/user", { headers }).then((r) => r.json());
        const emails = await fetch("https://api.github.com/user/emails", { headers }).then((r) => r.json());
        const primary = emails?.find((e) => e.primary)?.email || emails?.[0]?.email;
        return { ...user, email: primary || user.email };
      },
    },
    profile(profile) {
      return {
        id: String(profile.id),
        name: profile.name || profile.login,
        email: profile.email,
        image: profile.avatar_url,
      };
    },
  },
];

export async function getOAuthProviders() {
  return OAUTH_PROVIDERS.filter((p) => p.clientId && p.clientSecret);
}

export async function handleOAuthSignIn(provider, account, profile) {
  const { auth: authFn } = await import("./auth.js");
  return true;
}

export { auth };
