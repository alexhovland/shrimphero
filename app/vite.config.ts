import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Writes the Content-Security-Policy into index.html.
// GitHub Pages can't send HTTP headers, so the policy lives in a meta tag.
function contentSecurityPolicy(env: Record<string, string>): Plugin {
  const supabase = (env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const secure = supabase.startsWith('https://');
  const policy = [
    "default-src 'self'",
    "script-src 'self' https://challenges.cloudflare.com https://gc.zgo.at",
    "style-src 'self'",
    "img-src 'self' data: blob: https://axelhovner.goatcounter.com",
    "font-src 'self'",
    `connect-src 'self' ${supabase} https://tiles.openfreemap.org https://axelhovner.goatcounter.com`,
    'frame-src https://challenges.cloudflare.com',
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(secure ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
  return {
    name: 'shrimphero-csp',
    transformIndexHtml(html) {
      return html.replace('%CSP%', policy);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    // The site lives at https://<username>.github.io/shrimphero/. With a custom
    // domain later, set the repository variable BASE_PATH to "/".
    base: process.env.BASE_PATH || '/shrimphero/',
    plugins: [react(), contentSecurityPolicy(env)],
    build: {
      sourcemap: false,
      target: 'es2020',
      cssCodeSplit: true,
    },
  };
});
