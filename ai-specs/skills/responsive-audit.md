# Skill: Responsive Audit

## Propósito

Validar que una UI funciona de forma usable en móvil, tablet y desktop.

## Cuándo usarlo

- Cambios en componentes visuales.
- Cambios en CSS, layout, breakpoints o tooltips.
- Cambios en mapas o formularios.
- Antes de declarar lista una tarea que afecta experiencia móvil.

## Qué revisar

- Móvil: ancho 320-430px, sin scroll horizontal, targets táctiles cómodos.
- Tablet: transiciones de layout y espacio útil.
- Desktop: anchuras máximas, hover states y densidad visual.
- Textos: sin cortes raros ni solapes.
- Interacciones: touch no depende de hover.

## Cómo validar

1. Probar en DevTools con un viewport móvil tipo iPhone SE.
2. Probar tablet aproximada 768px.
3. Probar desktop 1280px o superior.
4. Ejecutar `npm run lint` y `npm run build`.

## Qué NO hacer

- No declarar una UI lista sin mirar móvil.
- No arreglar responsive reescribiendo componentes fuera de scope.
- No introducir breakpoints nuevos si los existentes bastan.
- No ocultar overflow para tapar contenido roto.

## Referencias

- `docs/MAP_UI_GUIDELINES.md`
- `docs/base-standards.md`
