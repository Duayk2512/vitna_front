import { writeFileSync } from 'node:fs';

const backend = new URL(process.argv[2] ?? process.env.VITNA_BACKEND_URL ?? '');
if (backend.protocol !== 'https:' || backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash) {
  throw new Error('Indicar el origen HTTPS público real del backend Railway, sin ruta ni credenciales.');
}
const config = {
  framework: 'angular',
  buildCommand: 'npm run build',
  outputDirectory: 'dist/frontend/browser',
  rewrites: [
    { source: '/api/:path*', destination: `${backend.origin}/api/:path*` },
    { source: '/((?!api/).*)', destination: '/index.html' }
  ],
  headers: [{ source: '/(.*)', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
  ] }]
};
writeFileSync(new URL('./vercel.json', import.meta.url), JSON.stringify(config, null, 2) + '\n');
console.log('vercel.json preparado para el origen Railway indicado.');
