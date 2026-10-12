export function createConfig(value) {
  if (!value) throw new Error('Falta VITNA_BACKEND_URL en Vercel: indicar el origen HTTPS público del backend Railway y volver a desplegar.');
  let backend;
  try { backend = new URL(value); } catch { throw new Error('VITNA_BACKEND_URL debe ser un origen HTTPS válido.'); }
  if (backend.protocol !== 'https:' || backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash || ['localhost', '127.0.0.1', '[::1]'].includes(backend.hostname) || backend.hostname.endsWith('.railway.internal')) {
    throw new Error('VITNA_BACKEND_URL debe ser el origen HTTPS público Railway, sin ruta, credenciales ni dominio privado.');
  }
  return {
    framework: 'angular',
    buildCommand: 'npm run build',
    outputDirectory: 'dist/frontend/browser',
    rewrites: [
      { source: '/api', destination: `${backend.origin}/api` },
      { source: '/api/:path*', destination: `${backend.origin}/api/:path*` }
    ],
    headers: [
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/(.*)', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
      ] }
    ]
  };
}

export const config = createConfig(process.env.VITNA_BACKEND_URL ?? 'https://vitnaback-production.up.railway.app');
