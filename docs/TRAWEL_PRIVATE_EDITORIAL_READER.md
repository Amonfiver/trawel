# Lector editorial privado

La ruta privada para revisar los borradores de Cuenca es:

```text
/editorial/destinos/cuenca
```

No es una ruta pública: solicita una sesión de Supabase Auth y los datos solo llegan al navegador a través de la Edge Function `private-editorial-reader`.

## Autorización

Los únicos roles admitidos son `editor` y `admin`. La función comprueba el JWT y la tabla privada `editorial_reader_roles` en el servidor antes de leer con service role. Las consultas directas de `anon` y `authenticated` siguen sometidas a la policy pública de `editorial_contents`, que solo permite `published`.

Para conceder acceso a una cuenta de Auth existente, un administrador de Supabase debe ejecutar en SQL Editor:

```sql
insert into public.editorial_reader_roles (user_id, role)
values ('<auth.users.id>', 'editor');
```

Para revocar acceso sin borrar la cuenta:

```sql
update public.editorial_reader_roles
set status = 'revoked'
where user_id = '<auth.users.id>';
```

No existe registro público en Trawel. La cuenta debe ser provisionada previamente en Supabase Auth por administración.

## Despliegue

El backend requiere la migración `017_create_private_editorial_reader.sql` y desplegar:

```text
npx supabase functions deploy private-editorial-reader
```

El hosting estático debe contener un build nuevo de `dist/` y tener fallback SPA para que la recarga directa de la ruta funcione. El lector no publica ni modifica `editorial_contents`.
