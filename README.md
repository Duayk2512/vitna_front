# VITNA frontend

Angular 22, Node 24. Ejecutar npm ci y npm start para desarrollo; /api utiliza el proxy local a localhost:8080. npm run build genera dist/frontend/browser.

Vercel: raíz de este repositorio, rama main. vercel.mjs conecta /api al backend Railway https://vitnaback-production.up.railway.app. Volver a desplegar el último commit. Consultar VERCEL.md para diagnóstico, pruebas y cambio de backend mediante VITNA_BACKEND_URL.

Incluye catálogo, compras, paneles y páginas de los seis roles, permisos de navegación y etiquetas CODE128. La autorización definitiva se valida en el backend.


Nuevas paginas y controles: consultar [OPERATIONS.md](OPERATIONS.md). El administrador puede configurar Brevo. Se conserva el componente principal y los estilos se sirven desde CSS.
