# Proxy de VITNA en Vercel

El archivo vercel.mjs configura /api y /api/:path* hacia el backend real:
https://vitnaback-production.up.railway.app

El frontend utiliza rutas hash (#/catalogo, #/panel), por lo que no necesita un rewrite global a index.html. Las solicitudes API nunca deben responder con esa página.

En Vercel usar este repositorio frontend, rama main, Root Directory raíz del repositorio, Node 24, build npm run build y salida dist/frontend/browser. Volver a desplegar el último commit. No conservar un vercel.json adicional: Vercel admite solo un archivo de configuración. No establecer un rewrite manual /api a index.html.

VITNA_BACKEND_URL es opcional para reemplazar el dominio anterior (por ejemplo en Preview con un backend de pruebas). Debe ser el origen HTTPS público Railway sin /api. Después de cambiarla, volver a desplegar. No es una contraseña ni un token.

Comprobar https://TU-FRONTEND/api/csrf: debe devolver JSON, no <!doctype html>. Después verificar login, recarga, CSRF y logout desde el mismo dominio frontend. La sesión sigue usando cookies HttpOnly/Secure/SameSite=Lax; no abrir CORS ni cambiar a llamadas directas al dominio Railway.

Si aparece HTML, revisar que el despliegue contiene vercel.mjs y no una versión antigua, el Root Directory y cualquier override de rutas. Si hay 502/503, revisar el estado del backend Railway. La comprobación completa requiere la URL Vercel real.

Pruebas: node --test tests/vercel-config.test.mjs y npm run build.

Referencia: [configuración programática Vercel](https://vercel.com/docs/project-configuration/vercel-ts).
