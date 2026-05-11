# Corrección del Sistema de Descuento de Bonos

## 🔧 Cambios Implementados

### 1. Base de Datos (transaction-service)

**Archivo**: `backend/services/transaction-service/sql/crear-tablas.sql`
- ✅ Agregadas columnas `descuento_bono` y `codigo_bono` a la tabla `pedido`

**Archivo**: `backend/services/transaction-service/sql/agregar-columnas-bono.sql` (NUEVO)
- ✅ Script SQL para agregar columnas a base de datos existente
- ✅ Incluye verificación de existencia para evitar errores
- ✅ Crea índice para búsquedas por código de bono

### 2. Backend - Modelo (transaction-service)

**Archivo**: `backend/services/transaction-service/src/modelos/Pedido.js`
- ✅ Método `crear()` actualizado para recibir `descuentoBono` y `codigoBono`
- ✅ Inserta valores en las nuevas columnas de la base de datos

### 3. Backend - Controlador (transaction-service)

**Archivo**: `backend/services/transaction-service/src/controladores/controladorCheckout.js`
- ✅ Extrae `descuento_bono` y `codigo_bono` del body de la petición
- ✅ **Validación de seguridad**: Llama a `credit-service` para validar el bono antes de aplicar descuento
- ✅ Verifica que el bono pertenece al usuario
- ✅ Verifica que el bono no esté usado o vencido
- ✅ Verifica que el monto del bono coincide con el enviado
- ✅ Calcula `totalFinal` restando el descuento validado
- ✅ Crea el pedido con el total descontado
- ✅ Marca el bono como "Usado" después de crear el pedido
- ✅ Retorna información completa del descuento aplicado

### 4. Frontend - API Service

**Archivo**: `frontend/src/services/api.ts`
- ✅ Método `procesarCheckout()` actualizado para enviar:
  - `descuento_bono`: Monto del descuento
  - `codigo_bono`: Código del bono aplicado

### 5. Frontend - CheckoutModal (Ya estaba correcto)

**Archivo**: `frontend/src/components/CheckoutModal.tsx`
- ✅ Ya enviaba correctamente `descuento_bono` y `codigo_bono`
- ✅ Calcula `totalConBono` correctamente en el frontend
- ✅ Usa refs para evitar valores stale en closures

---

## 📋 Pasos para Aplicar en Producción

### 1. Actualizar Base de Datos
```bash
# Conectar a la base de datos de transaction-service
psql $DATABASE_URL

# Ejecutar el script de migración
\i backend/services/transaction-service/sql/agregar-columnas-bono.sql
```

### 2. Desplegar Backend
```bash
# Reconstruir imagen de transaction-service
docker build -t us-central1-docker.pkg.dev/crypto-topic-492202-q9/egos-registry/transaction-service:latest \
  ./backend/services/transaction-service

# Push a Artifact Registry
docker push us-central1-docker.pkg.dev/crypto-topic-492202-q9/egos-registry/transaction-service:latest

# Reiniciar deployment en GKE
kubectl rollout restart deployment/transaction-service -n egos
```

### 3. Desplegar Frontend
```bash
# Reconstruir imagen de frontend
docker build -t us-central1-docker.pkg.dev/crypto-topic-492202-q9/egos-registry/frontend:latest \
  ./frontend

# Push a Artifact Registry
docker push us-central1-docker.pkg.dev/crypto-topic-492202-q9/egos-registry/frontend:latest

# Reiniciar deployment en GKE
kubectl rollout restart deployment/frontend -n egos
```

### 4. Verificar Funcionamiento
```bash
# Ver logs del transaction-service
kubectl logs -f deployment/transaction-service -n egos

# Buscar mensajes como:
# 🎁 Validando bono EGOSXXXXXX para usuario X
# ✅ Bono validado: -$100000 | Total final: $XXXXX
# 🎁 Bono EGOSXXXXXX marcado como usado en pedido EMXXXXXXX
```

---

## 🔍 Flujo Completo del Bono (Corregido)

### Antes (❌ Problema)
1. Usuario ingresa código de bono en frontend
2. Frontend valida bono con `credit-service`
3. Frontend calcula descuento y muestra total reducido
4. Frontend envía checkout con `total` ya descontado
5. **Backend crea pedido SIN validar el bono** ❌
6. Backend marca bono como usado
7. **Resultado**: Bono consumido pero pedido con monto completo

### Ahora (✅ Solución)
1. Usuario ingresa código de bono en frontend
2. Frontend valida bono con `credit-service`
3. Frontend calcula descuento y muestra total reducido
4. Frontend envía checkout con:
   - `items`: productos con precios originales
   - `descuento_bono`: monto del descuento
   - `codigo_bono`: código del bono
5. **Backend valida bono nuevamente con `credit-service`** ✅
6. **Backend verifica que el bono es válido y pertenece al usuario** ✅
7. **Backend calcula `totalFinal = total - descuento_validado`** ✅
8. **Backend crea pedido con `totalFinal` descontado** ✅
9. Backend marca bono como usado
10. **Resultado**: Bono consumido Y pedido con descuento aplicado ✅

---

## 🔒 Mejoras de Seguridad Implementadas

1. **Validación en Backend**: El backend NO confía en el frontend, valida el bono independientemente
2. **Verificación de Propiedad**: Solo el dueño del bono puede usarlo
3. **Verificación de Estado**: No se pueden usar bonos vencidos o ya usados
4. **Verificación de Monto**: El monto del descuento debe coincidir con el valor del bono
5. **Idempotencia**: Si falla la comunicación con credit-service, el pedido no se crea

---

## 🧪 Casos de Prueba

### Caso 1: Bono Válido
- Usuario con bono disponible de $100.000
- Carrito con total de $250.000
- **Resultado esperado**: Pedido creado con total de $150.000

### Caso 2: Bono Inválido
- Usuario intenta usar bono que no existe
- **Resultado esperado**: Error 400 "Bono no válido"

### Caso 3: Bono de Otro Usuario
- Usuario A intenta usar bono de Usuario B
- **Resultado esperado**: Error 400 "Este bono no pertenece a tu cuenta"

### Caso 4: Bono Ya Usado
- Usuario intenta reutilizar un bono consumido
- **Resultado esperado**: Error 400 "Este bono ya fue utilizado"

### Caso 5: Bono Vencido
- Usuario intenta usar bono después de 30 días
- **Resultado esperado**: Error 400 "Este bono ha vencido"

### Caso 6: Manipulación de Monto
- Usuario modifica el descuento en el frontend (ej: $100.000 → $500.000)
- **Resultado esperado**: Error 400 "Monto de bono no coincide"

---

## 📊 Campos Agregados a la Base de Datos

```sql
-- Tabla: pedido
descuento_bono DECIMAL(10,2) DEFAULT 0  -- Monto descontado por bono
codigo_bono VARCHAR(20)                  -- Código del bono aplicado (ej: EGOSAB3K9M)
```

---

## 🎯 Beneficios de la Corrección

1. ✅ El descuento del bono se aplica correctamente al total del pedido
2. ✅ El backend valida la autenticidad del bono antes de aplicar descuento
3. ✅ Se previenen fraudes por manipulación del frontend
4. ✅ Se registra qué bono fue usado en cada pedido (trazabilidad)
5. ✅ Los reportes contables reflejarán el monto real pagado
6. ✅ Las facturas electrónicas mostrarán el descuento aplicado

---

## 📝 Notas Adicionales

- El campo `descuento_bono` se usa para reportes y auditoría
- El campo `codigo_bono` permite rastrear qué bono se usó en cada pedido
- El bono se marca como "Usado" solo después de crear el pedido exitosamente
- Si el pedido falla, el bono NO se consume (transaccionalidad)
- El sistema es compatible con pedidos sin bono (valores por defecto: 0 y null)

---

## 🚀 Estado: LISTO PARA PRODUCCIÓN

Todos los cambios han sido implementados y están listos para desplegar.
