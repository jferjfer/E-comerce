-- Agregar campos de perfil a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
ADD COLUMN IF NOT EXISTS direccion VARCHAR(255),
ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100);
