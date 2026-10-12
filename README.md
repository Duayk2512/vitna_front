# VITNA frontend

Angular 22, Node 24. Ejecutar npm ci y npm start para desarrollo; /api utiliza el proxy local a localhost:8080. npm run build genera dist/frontend/browser.

Despliegue Vercel: configurar el dominio real de Railway mediante node configure-vercel.mjs https://DOMINIO-REAL y agregar vercel.json al repositorio antes de desplegar. Root Directory es la raíz de este repositorio. Consultar DEPLOYMENT.md.

Incluye catálogo, compras, paneles y páginas de los seis roles, permisos de navegación y etiquetas CODE128. La autorización definitiva se valida en el backend.
