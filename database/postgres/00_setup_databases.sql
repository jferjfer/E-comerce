-- ====================================================
-- CONFIGURACIÓN INICIAL - BASES DE DATOS STYLEHUB
-- ====================================================

-- Crear todas las bases de datos necesarias
CREATE DATABASE stylehub_auth;
CREATE DATABASE stylehub_catalog;
CREATE DATABASE stylehub_transactions;
CREATE DATABASE stylehub_logistics;
CREATE DATABASE stylehub_credit;

-- Crear usuario para la aplicación
CREATE USER stylehub_user WITH PASSWORD 'stylehub_pass';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE stylehub_auth TO stylehub_user;
GRANT ALL PRIVILEGES ON DATABASE stylehub_catalog TO stylehub_user;
GRANT ALL PRIVILEGES ON DATABASE stylehub_transactions TO stylehub_user;
GRANT ALL PRIVILEGES ON DATABASE stylehub_logistics TO stylehub_user;
GRANT ALL PRIVILEGES ON DATABASE stylehub_credit TO stylehub_user;

-- Habilitar extensiones necesarias
\c stylehub_auth;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c stylehub_catalog;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c stylehub_transactions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c stylehub_logistics;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c stylehub_credit;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";