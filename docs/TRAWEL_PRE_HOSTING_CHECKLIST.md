# Trawel Pre-Hosting Checklist

Checklist tecnica para preparar Trawel antes de subirlo a un hosting real.

## 1. Objetivo

- [ ] Preparar Trawel para hosting real.
- [ ] Evitar fallos de rutas SPA al refrescar paginas internas.
- [ ] Confirmar variables de entorno publicas necesarias.
- [ ] Confirmar build de produccion.
- [ ] Confirmar pruebas online posteriores al deploy.

## 2. Variables Necesarias

Variables frontend requeridas:

- `VITE_SUPABASE_URL`.
- `VITE_SUPABASE_ANON_KEY`.

Comprobaciones:

- [ ] Configurar ambas variables en el panel del hosting.
- [ ] Confirmar que `.env` local no se sube a git.
- [ ] Confirmar que `.env.example` no contiene secretos reales.
- [ ] Confirmar que no se sube ninguna clave privada.
- [ ] Confirmar que `SUPABASE_SERVICE_ROLE_KEY` nunca va al frontend ni a variables `VITE_`.

Nota:

- Las variables con prefijo `VITE_` quedan expuestas al navegador.
- La anon key de Supabase esta pensada para cliente publico bajo RLS.
- La service role solo puede vivir en backend, CI controlado o Edge Functions seguras.

## 3. Build

Comando:

```bash
npm run build
```

Carpeta esperada:

```text
dist/
```

Aviso conocido:

- El warning de chunk grande de Vite no bloquea si `npm run build` termina correctamente.
- Si aparecen errores de TypeScript o build, no desplegar hasta corregirlos.

## 4. Rutas SPA A Proteger

El hosting debe redirigir cualquier ruta de la app a `index.html`. Si no se configura fallback SPA, estas rutas pueden fallar al refrescar o abrir enlace directo:

- `/`
- `/contacto`
- `/compartir`
- `/pais/mexico`
- `/pais/espana`
- `/privacidad`
- `/cookies`
- `/terminos`
- `/sobre-trawel`

Regla:

- Los assets estaticos deben servirse normalmente.
- Las rutas de React Router deben caer en `index.html`.

## 5. Hosting Recomendado

| Hosting | Ventajas | Atencion |
|---------|----------|----------|
| Netlify | Muy sencillo para Vite; redirects faciles; deploy desde `dist/`. | Requiere `_redirects` o regla equivalente para SPA. |
| Vercel | Sencillo para React/Vite; buen flujo Git. | Confirmar fallback SPA y variables de entorno. |
| Hosting tradicional | Valido si sirve `dist/`. | Hay que configurar manualmente fallback SPA, cache y HTTPS. |

Decision pendiente:

- [ ] Netlify.
- [ ] Vercel.
- [ ] Otro.

## 6. Redirects Si Se Usa Netlify

Propuesta para Netlify:

```text
/*    /index.html   200
```

Archivo sugerido:

```text
public/_redirects
```

No crear este archivo todavia hasta decidir que Netlify sera el hosting elegido.

## 7. Checklist Antes De Deploy

- [ ] Ejecutar `npm run build`.
- [ ] Confirmar que existe `dist/`.
- [ ] Revisar `.env.example` o documentacion de variables necesarias.
- [ ] Configurar `VITE_SUPABASE_URL` en hosting.
- [ ] Configurar `VITE_SUPABASE_ANON_KEY` en hosting.
- [ ] Confirmar que no hay secretos privados en variables frontend.
- [ ] Confirmar que no aparece `SUPABASE_SERVICE_ROLE_KEY` en frontend.
- [ ] Revisar rutas locales principales.
- [ ] Revisar `/contacto`.
- [ ] Revisar `/compartir`.
- [ ] Revisar reporte discreto en TrustPage.
- [ ] Revisar consola del navegador sin errores bloqueantes.

## 8. Checklist Despues De Deploy

- [ ] Abrir Home.
- [ ] Refrescar `/pais/mexico`.
- [ ] Refrescar `/contacto`.
- [ ] Refrescar `/compartir`.
- [ ] Refrescar `/privacidad`.
- [ ] Enviar contacto test.
- [ ] Enviar compartir test.
- [ ] Enviar reporte test.
- [ ] Comprobar filas en Supabase.
- [ ] Verificar estados:
  - contacto: `pending_review`.
  - compartir: `pending_review`.
  - reporte: `pending_review`.
- [ ] Confirmar que anon no puede leer colas.
- [ ] Borrar filas test.

## 9. Decision Pendiente

Elegir hosting:

- Netlify.
- Vercel.
- Otro.

Hasta elegir hosting, no crear archivos especificos de plataforma ni cambiar configuracion del proyecto.
