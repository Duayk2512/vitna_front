# Despliegue VITNA

Backend: repositorio vitna_back en Railway, base Postgres existente. Consultar RAILWAY.md en ese repositorio para referencias DB_URL, DB_USER, DB_PASSWORD y perfil prod. Conservar migraciones Flyway y respaldos.

Frontend: este repositorio en Vercel. Consultar VERCEL.md. vercel.mjs configura el proxy mismo origen hacia el dominio Railway real; reemplaza el antiguo paso manual configure-vercel.mjs y no requiere generar vercel.json. No tener ambos archivos de configuración.

Validar login, CSRF, persistencia de sesión y logout desde el dominio Vercel. Nunca incluir credenciales en GitHub.
