-- Tabla: Historial de Estados del Pedido
CREATE TABLE IF NOT EXISTS pedido_historial (
    id SERIAL PRIMARY KEY,
    id_pedido UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    comentario TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pedido_historial_pedido ON pedido_historial(id_pedido);
CREATE INDEX idx_pedido_historial_fecha ON pedido_historial(fecha_cambio);

-- Función para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION registrar_cambio_estado_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.estado != NEW.estado) THEN
        INSERT INTO pedido_historial (id_pedido, estado_anterior, estado_nuevo, comentario)
        VALUES (NEW.id, OLD.estado, NEW.estado, 'Cambio automático de estado');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar cambios automáticamente
DROP TRIGGER IF EXISTS trigger_cambio_estado_pedido ON pedido;
CREATE TRIGGER trigger_cambio_estado_pedido
    AFTER UPDATE ON pedido
    FOR EACH ROW
    EXECUTE FUNCTION registrar_cambio_estado_pedido();
