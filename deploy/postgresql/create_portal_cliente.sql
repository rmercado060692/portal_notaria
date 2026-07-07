-- Provisionamiento PostgreSQL para la base exclusiva del Portal Digital.
-- Ejecutar con un usuario administrador de PostgreSQL, por ejemplo `postgres`.
-- Antes de ejecutarlo en el servidor, reemplazar CHANGE_ME_PORTAL_DB_PASSWORD
-- por una clave real generada y almacenada solo en el archivo privado del servidor.
-- Este script no toca la base `notarios` ni modifica MariaDB/SIGNO.

DO
$$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_roles
        WHERE rolname = 'portal_user'
    ) THEN
        CREATE ROLE portal_user LOGIN PASSWORD 'CHANGE_ME_PORTAL_DB_PASSWORD';
    ELSE
        ALTER ROLE portal_user WITH LOGIN PASSWORD 'CHANGE_ME_PORTAL_DB_PASSWORD';
    END IF;
END
$$;

SELECT 'CREATE DATABASE portal_cliente OWNER portal_user ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_database
    WHERE datname = 'portal_cliente'
)\gexec

REVOKE ALL ON DATABASE portal_cliente FROM PUBLIC;
GRANT ALL PRIVILEGES ON DATABASE portal_cliente TO portal_user;

\connect portal_cliente

ALTER SCHEMA public OWNER TO portal_user;
GRANT ALL ON SCHEMA public TO portal_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO portal_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO portal_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON FUNCTIONS TO portal_user;
