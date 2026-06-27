# Trawel Showcase Readiness

Auditoria practica para cerrar la etapa de escaparate publico y evitar microbloques infinitos.

## 1. Pantallas Ya Preparadas

- [x] Home: usa fachada `getResolvedHomeScreenData()` y puede mezclar remoto/fallback.
- [x] CountryPage: usa `getResolvedCountryScreenData()` con pais, editorial y promociones.
- [x] CountryZonePage: usa `getResolvedZoneScreenData()` con zona y promociones.
- [x] Trust pages: `static_pages` ya permite contenido publicado desde Supabase.
- [~] Compartir/contacto/comunidad: existe flujo publico parcial, CTA, contrato de colas y migration local; falta ejecucion remota y conexion real.

## 2. Datos Que Ya Puede Leer Desde Supabase

- [x] `countries`: base de paises destacados y datos de CountryPage.
- [x] `cities`: base conservadora para zonas.
- [x] `destinations`: planes/destinos destacados de Home.
- [x] `editorial_contents`: editorial publicado para pais.
- [x] `promotions`: slots controlados en Home, CountryPage y CountryZonePage.
- [x] `static_pages`: paginas de confianza/legales/estaticas.

## 3. Sigue Local O Fallback

- [ ] Imagenes y assets visuales.
- [ ] Hero/copy cuando no hay remoto suficiente.
- [ ] Algunos planes/destinos destacados.
- [ ] Mapas internos y assets cartograficos.
- [ ] CTA comunidad.
- [ ] Fallback premium de contenido y experiencia.

## 4. Necesario Para Escaparate Funcional

- [~] Recibir mensajes/contactos desde paginas publicas: fachada preparada y migration local definida; falta aplicar schema remoto y conectar formulario.
- [~] Recibir fotos/aportes de usuarios: migration local definida; falta storage/upload seguro y formulario.
- [~] Guardar todo en cola de revision: migration local definida con RLS; falta ejecucion remota.
- [ ] Nunca publicar directo desde usuario.
- [x] Permitir promociones controladas sin invadir la experiencia.
- [x] Mantener fallback premium si falta contenido remoto.

## 5. Queda Para Investighost Futuro

- [ ] Panel de moderacion.
- [ ] Aprobar/rechazar fotos.
- [ ] Aprobar/rechazar comentarios o aportes.
- [ ] Cargar y revisar contenido editorial.
- [ ] Gestionar promociones, sponsors y campanas.
- [ ] Revisar senales de demanda.

## 6. Proximos 3 Bloques Recomendados

1. Revisar y ejecutar migration de colas contra Supabase cuando proceda.
2. Conectar formularios publicos a inserts controlados.
3. Cerrar checklist de escaparate funcional.

## Conclusion

Trawel ya esta cerca de ser un escaparate publico alimentable desde Supabase. Lo pendiente no es seguir moviendo cada bloque visual a remoto, sino completar las colas publicas de entrada y mantener la publicacion siempre bajo revision.
