# Trawel Database First Roadmap

> Hoja de ruta viva para llevar Trawel a funcionamiento 100% base de datos.
> Objetivo: que futuros agentes entiendan la vision operativa sin releer toda la conversacion.

---

## 1. Vision

- [ ] **Trawel = escaparate vivo:** app publica que muestra destinos, paises, zonas, rutas, planes, fotos, mensajes y senales aprobadas.
- [ ] **Supabase = fuente central de verdad:** todo contenido publico debe poder resolverse desde datos publicados, con reglas de visibilidad y moderacion.
- [ ] **Investighost = sala de maquinas / resurtidor:** futuro panel maestro para investigar, preparar, revisar y alimentar Supabase.

**Regla clave:** Investighost se documenta como destino futuro, pero no se implementa en Trawel en esta fase.

---

## 2. Estado actual validado

- [x] `static_pages` ya conectado en paginas de confianza mediante lectura publicada y fallback local.
- [x] `promotions` ya conectado en `CountryZonePage` como bloques nativos no invasivos.
- [x] `editorial_contents` ya conectado para `CountryPage`.
- [x] Espana tiene demo remota usable desde contenido publicado.
- [x] Mexico remoto real fue cargado y validado en Supabase para modos `adventure` y `student`.
- [x] El fallback local premium sigue como red de seguridad si Supabase falla, falta contenido o el remoto esta incompleto.

---

## 3. Pendiente local o parcial

- [ ] Home.
- [ ] Datos completos de paises.
- [ ] Zonas.
- [ ] Rutas.
- [ ] Planes.
- [ ] Lugares.
- [ ] Imagenes.
- [ ] Fotos de usuarios.
- [ ] Mensajes/formularios.
- [ ] Demand signals avanzadas.

---

## 4. Fases checklist

### Fase 1 - Consolidar lo conectado

- [ ] Auditar `static_pages`, `promotions` y `editorial_contents` ya conectados.
- [ ] Confirmar contratos minimos de lectura y fallback.
- [ ] Documentar huecos sin cambiar schema ni seeds salvo bloque explicito.

### Fase 2 - CountryPage 100% base de datos

- [ ] Inventariar datos locales que aun alimentan `CountryPage`.
- [ ] Definir el contrato completo de pais publicado.
- [ ] Mantener fallback premium obligatorio para paises incompletos.
- [ ] No romper mapa interno, rutas ni navegacion.

### Fase 3 - CountryZonePage 100% base de datos

- [ ] Inventariar datos locales de zona.
- [ ] Definir contrato completo de zona publicada.
- [ ] Mantener hero/fallback si faltan imagenes o copy.
- [ ] No tocar mapas ni comportamiento tactil sin bloque especifico.

### Fase 4 - Home data-driven

- [ ] Auditar secciones de Home que siguen hardcoded.
- [ ] Definir que bloques salen de Supabase.
- [ ] Mantener experiencia publica estable mientras falten datos.

### Fase 5 - Sistema de imagenes y fotos de usuarios

- [ ] Separar imagenes editoriales aprobadas de fotos enviadas por usuarios.
- [ ] Definir estados, autoria, creditos, retirada y moderacion.
- [ ] Usar fallback visual premium si falta imagen aprobada.

### Fase 6 - Mensajes y participacion

- [ ] Formularios, sugerencias, reportes y contacto deben entrar como cola revisable.
- [ ] Nunca publicar contenido de usuario directamente.
- [ ] Preparar moderacion antes de mostrar nada en publico.

### Fase 7 - Demand signals

- [ ] Registrar busquedas, clicks, interes por pais/zona/lugar y solicitudes futuras.
- [ ] Mantener las senales como insumo interno, no como contenido editorial directo.
- [ ] Evitar mostrar demanda avanzada sin reglas claras de privacidad.

### Fase 8 - Promociones y monetizacion

- [ ] Consolidar promociones nativas con disclosure visible.
- [ ] Evitar popups, overlays invasivos o anuncios que rompan la exploracion.
- [ ] Priorizar relevancia por contexto: pais, zona, modo y momento del viaje.

### Fase 9 - Investighost futuro como panel maestro

- [ ] Definir Investighost como herramienta externa a Trawel.
- [ ] Preparar contratos para que Investighost alimente Supabase.
- [ ] No implementar panel maestro dentro de Trawel durante esta hoja de ruta.

---

## 5. Reglas de seguridad

- [ ] Los usuarios nunca publican directamente.
- [ ] Todo contenido externo entra en cola de revision.
- [ ] Fotos, mensajes, sugerencias, reportes y solicitudes de retirada pasan por moderacion.
- [ ] Fallback premium obligatorio si falta contenido publicado o si Supabase falla.
- [ ] No romper mapas.
- [ ] No tocar migrations/seeds sin bloque explicito.
- [ ] No mezclar implementacion de Investighost dentro de Trawel.

---

## 6. Prioridad inmediata tras este documento

1. Auditar que sigue local.
2. CountryPage 100% BD.
3. CountryZonePage 100% BD.
4. Home data-driven.
5. Imagenes/fotos de usuarios.
6. Mensajes/moderacion.
7. Demand signals.
8. Promociones avanzadas.

---

## 7. Lecturas relacionadas

- `docs/AGENT_BRIEF.md`
- `docs/TRAWEL_DATA_CONTRACTS.md`
- `docs/TRAWEL_SUPABASE_MODEL.md`
- `docs/TRAWEL_SUPABASE_LEGACY_MAPPING.md`
- `docs/INVESTIGHOST_CONTRACT.md`
- `docs/TRAWEL_CONTENT_INPUT_GUIDE.md`
