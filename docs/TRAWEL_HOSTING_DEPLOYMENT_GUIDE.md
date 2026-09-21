# Trawel Hosting Deployment Guide

Guia practica para subir Trawel a un hosting estatico tipo Hostinger.

Fecha: 2026-07-09.
Bloque: 84.

## 1. Objetivo

Publicar Trawel como sitio estatico generado por Vite, usando la carpeta `dist/` como paquete final de produccion.

Trawel publico no usa backend propio en el hosting:

- Lee datos publicos desde Supabase.
- Envia formularios protegidos a Supabase Edge Function `protected-public-submit`.
- Usa Cloudflare Turnstile en navegador con site key publica.
- Mantiene `TURNSTILE_SECRET_KEY` solo como Supabase secret.

## 2. Variables Antes Del Build

Configurar las variables frontend antes de generar el build:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TURNSTILE_SITE_KEY=
```

Notas:

- Las variables `VITE_` se compilan dentro del bundle y son publicas para el navegador.
- `VITE_SUPABASE_ANON_KEY` es la anon public key de Supabase, no una service role key.
- `TURNSTILE_SECRET_KEY` no va en el hosting estatico ni en variables `VITE_`; ya vive en Supabase secrets.
- `.env.local` no se sube al hosting ni a Git.
- No subir nunca `SUPABASE_SERVICE_ROLE_KEY` al frontend.

## 3. Generar Build

Desde la raiz del proyecto:

```bash
npm run build
```

Resultado esperado:

```text
dist/
```

Confirmar que existe:

```text
dist/index.html
```

El warning de Vite por chunk grande no bloquea el despliegue inicial si el comando termina correctamente.

## 4. Archivo `.htaccess`

Para Hostinger o hosting Apache tradicional, subir tambien:

```text
dist/.htaccess
```

Contenido esperado:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Este archivo evita que las rutas internas de React Router fallen al abrirlas directamente o al recargar.

Importante: `npm run build` puede limpiar `dist/`. Si falta `dist/.htaccess` despues del build, recrearlo antes de subir.

## 5. Que Subir

Subir el contenido completo de:

```text
dist/
```

No subir la carpeta `dist` como subcarpeta si el hosting espera archivos dentro de `public_html`; subir el contenido de `dist/` al directorio publico del dominio.

Debe incluir:

- `index.html`.
- Carpeta `assets/`.
- Carpeta `destinations/`, incluyendo cada `manifest.json` y sus medios. No es parte de `assets/`.
- `.htaccess`.

Estructura mínima para el piloto Cuenca:

```text
public_html/
├── index.html
├── assets/
├── destinations/
│   └── cuenca/
│       ├── manifest.json
│       └── shared/
│           ├── hero/casas-colgadas-atardecer.png
│           └── ...
├── maps/
└── .htaccess
```

Después de subir, abrir directamente estas URLs. Deben devolver JSON y PNG, nunca la página HTML de la SPA:

- `https://trawel.net/destinations/cuenca/manifest.json`
- `https://trawel.net/destinations/cuenca/shared/hero/casas-colgadas-atardecer.png`

No subir:

- `.env.local`.
- `.env`.
- `node_modules/`.
- `src/`.
- `supabase/`.
- `docs/`.
- Secrets o claves privadas.

## 6. Cloudflare Turnstile

Antes de probar formularios online:

- Anadir el dominio o subdominio real en Cloudflare Turnstile.
- Confirmar que `VITE_TURNSTILE_SITE_KEY` corresponde al widget correcto.
- Confirmar que `TURNSTILE_SECRET_KEY` sigue configurada como Supabase secret para `protected-public-submit`.

Si el hostname real no esta permitido en Cloudflare, Turnstile puede cargar mal o no emitir tokens validos.

## 7. Rutas SPA A Probar Online

Abrir y recargar directamente:

- `/`
- `/contacto`
- `/compartir`
- `/comunidad`
- `/pais/mexico`
- `/pais/espana`
- `/pais/espana/zona/castellon`

Resultado esperado:

- Todas cargan la app.
- Ninguna devuelve 404 del hosting al recargar.
- Los assets cargan correctamente.

## 8. Formularios Online

Probar con Turnstile real en el dominio definitivo:

- `/contacto`.
- `/compartir` con Mexico + Chihuahua.
- `/compartir` con ciudad manual inventada.
- Reporte publico en TrustPage.

Resultado esperado:

- Turnstile carga.
- Turnstile marca exito.
- El formulario no permite enviar sin token.
- El formulario envia con token.
- Las entradas llegan a colas privadas de Supabase como `pending_review`.
- Nada se publica directamente.

## 9. Verificacion Supabase

Desde Supabase SQL Editor o rol interno, revisar las filas recientes tras las pruebas online:

```sql
select
  id,
  created_at,
  status,
  type,
  kind,
  source_page,
  name,
  email,
  subject,
  country_slug,
  zone_slug,
  message,
  metadata
from user_messages
order by created_at desc
limit 10;
```

Recordatorio: el cliente anon no debe poder leer `user_messages`.
