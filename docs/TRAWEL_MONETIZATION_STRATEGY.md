# Trawel Monetization Strategy

Documento operativo para mantener la monetizacion de Trawel controlada, discreta y compatible con una experiencia premium.

## Vision

Trawel usara slots de monetizacion controlados entre secciones. La monetizacion debe acompanar el contenido, no interrumpir la exploracion ni competir con mapas, hero o llamadas principales.

## Prioridad De Cada Slot

1. Promocion propia publicada desde Supabase.
2. AdSense manual futuro, solo si esta aprobado y activo.
3. Bloque editorial o colaborador discreto.
4. Nada.

Si no hay contenido valido, el slot no ocupa espacio visible.

## Regla Sobre AdSense

AdSense automatico no sera la estrategia principal de Trawel.

Si se usa AdSense en el futuro, debe ser:

- Manual.
- Limitado.
- Activado solo en placements aprobados.
- Compatible con la estetica premium.
- Nunca por encima del contenido principal.

## Zonas Permitidas

- Entre destinos y planes.
- Despues del editorial de pais.
- Despues de la intro de zona.
- Antes del footer si procede.

## Zonas Prohibidas

- Hero principal.
- Header.
- Mapa mundial.
- Primer pantallazo movil.
- Encima de CTA principal.

## Fuente De Verdad

Supabase controla las promociones publicadas. Solo debe mostrarse contenido con estado publicado y datos minimos seguros.

Investighost sera el futuro panel maestro para gestionar sponsors, campanas, revision editorial y publicacion. No forma parte de la implementacion actual.

## Regla Operativa Para Agentes

Usar `MonetizationSlot` para nuevas ubicaciones de monetizacion. No crear banners ad hoc, no integrar AdSense real sin bloque explicito y no colocar slots sobre mapas, hero, header o CTAs principales.
