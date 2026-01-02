# 🔄 Sistema de Gestión de Devoluciones

Sistema completo de gestión de devoluciones con flujo de aprobación en 3 niveles.

## 📋 Flujo de Devoluciones

```
Cliente → Solicita → Customer Success → Aprueba/Rechaza → Logistics → Completa
```

### Estados:
1. **Solicitada** - Cliente solicita devolución
2. **Aprobada** - Customer Success aprueba
3. **Rechazada** - Customer Success rechaza
4. **Completada** - Logistics marca como completada

---

## 🚀 INSTALACIÓN

### 1. Actualizar Base de Datos

```bash
cd backend/services/transaction-service
node actualizar-devolucion.js
```

Esto agregará las columnas necesarias a la tabla `devolucion`:
- `comentario_aprobacion`
- `motivo_rechazo`
- `comentario_completado`

### 2. Reiniciar Transaction Service

```bash
# Si usas Docker
docker-compose restart transaction-service

# Si ejecutas local
cd backend/services/transaction-service
npm run iniciar
```

### 3. Reiniciar Frontend

```bash
cd frontend
npm run dev
```

---

## 👥 USUARIOS DE PRUEBA

### Customer Success
```
Email: customersuccess@estilomoda.com
Password: admin123
Rol: customer_success
```

### Logistics Coordinator
```
Email: logistics@estilomoda.com
Password: admin123
Rol: logistics_coordinator
```

### Cliente (para solicitar devoluciones)
```
Email: demo@estilomoda.com
Password: admin123
Rol: cliente
```

---

## 🧪 PRUEBA DEL FLUJO COMPLETO

### Paso 1: Cliente solicita devolución

1. Login como cliente: `demo@estilomoda.com`
2. Ir a "Mis Pedidos"
3. Click en "Solicitar Devolución" en un pedido
4. Ingresar razón: "Producto defectuoso"
5. Confirmar

### Paso 2: Customer Success aprueba

1. Logout y login como: `customersuccess@estilomoda.com`
2. Serás redirigido automáticamente al Dashboard Customer Success
3. Verás la devolución en estado "Solicitada"
4. Click en "Aprobar"
5. Confirmar

### Paso 3: Logistics completa

1. Logout y login como: `logistics@estilomoda.com`
2. Serás redirigido automáticamente al Dashboard Logística
3. Verás la devolución en estado "Aprobada"
4. Click en "Marcar Completada"
5. Confirmar

### Paso 4: Verificar

1. Login nuevamente como cliente
2. Ir a "Mis Pedidos"
3. Ver estado de devolución: "Completada"

---

## 📡 ENDPOINTS BACKEND

### Listar devoluciones
```http
GET /api/devoluciones?estado=Solicitada
Authorization: Bearer {token}
```

### Aprobar devolución
```http
PUT /api/devoluciones/:id/aprobar
Authorization: Bearer {token}
Content-Type: application/json

{
  "comentario": "Aprobada por Customer Success"
}
```

### Rechazar devolución
```http
PUT /api/devoluciones/:id/rechazar
Authorization: Bearer {token}
Content-Type: application/json

{
  "motivo": "No cumple con política de devoluciones"
}
```

### Completar devolución
```http
PUT /api/devoluciones/:id/completar
Authorization: Bearer {token}
Content-Type: application/json

{
  "comentario": "Producto recibido y procesado"
}
```

---

## 🎨 COMPONENTES FRONTEND

### Nuevos archivos creados:

1. **CustomerSuccessDashboard.tsx**
   - Ubicación: `frontend/src/pages/dashboards/`
   - Función: Gestionar devoluciones solicitadas
   - Acciones: Aprobar/Rechazar

2. **LogisticsCoordinatorDashboard.tsx**
   - Ubicación: `frontend/src/pages/dashboards/`
   - Función: Completar devoluciones aprobadas
   - Acciones: Marcar como completada

### Archivos modificados:

1. **App.tsx** - Agregadas rutas para nuevos dashboards
2. **Header.tsx** - Agregadas opciones de menú
3. **RoleBasedHome.tsx** - Agregadas redirecciones automáticas

---

## 🔐 PERMISOS

### Customer Success
- ✅ Ver devoluciones solicitadas
- ✅ Aprobar devoluciones
- ✅ Rechazar devoluciones
- ❌ Completar devoluciones

### Logistics Coordinator
- ✅ Ver devoluciones aprobadas
- ✅ Completar devoluciones
- ❌ Aprobar/Rechazar devoluciones

### CEO
- ✅ Todos los permisos (puede aprobar, rechazar y completar)

---

## 📊 ESTRUCTURA DE DATOS

### Tabla: devolucion

```sql
id                      SERIAL PRIMARY KEY
id_pedido               UUID (FK → pedido.id)
usuario_id              INTEGER
razon                   TEXT
estado                  VARCHAR(50) CHECK (Solicitada, Aprobada, Rechazada, Completada)
comentario_aprobacion   TEXT
motivo_rechazo          TEXT
comentario_completado   TEXT
fecha_creacion          TIMESTAMP
fecha_actualizacion     TIMESTAMP
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [x] GET /api/devoluciones
- [x] PUT /api/devoluciones/:id/aprobar
- [x] PUT /api/devoluciones/:id/rechazar
- [x] PUT /api/devoluciones/:id/completar
- [x] Validación de roles
- [x] Validación de estados

### Frontend
- [x] CustomerSuccessDashboard.tsx
- [x] LogisticsCoordinatorDashboard.tsx
- [x] Rutas en App.tsx
- [x] Opciones en Header.tsx
- [x] Redirecciones en RoleBasedHome.tsx

### Base de Datos
- [x] Columnas adicionales
- [x] Constraint de estados actualizado
- [x] Script de migración

---

## 🐛 TROUBLESHOOTING

### Error: "Columna no existe"
```bash
# Ejecutar script de actualización
node backend/services/transaction-service/actualizar-devolucion.js
```

### Error: "No tienes permisos"
- Verificar que el usuario tenga rol `customer_success` o `logistics_coordinator`
- Verificar que el token JWT sea válido

### Devoluciones no aparecen
- Verificar que existan pedidos con devoluciones solicitadas
- Verificar filtro de estado en la consulta

---

## 📈 MÉTRICAS

El sistema registra:
- Total de devoluciones solicitadas
- Total de devoluciones aprobadas
- Total de devoluciones rechazadas
- Total de devoluciones completadas
- Tiempo promedio de procesamiento

---

## 🚀 PRÓXIMAS MEJORAS

- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Historial de cambios de estado
- [ ] Reembolsos automáticos
- [ ] Integración con sistema de inventario
- [ ] Dashboard de métricas de devoluciones
- [ ] Exportar reportes en PDF/Excel

---

## 📞 SOPORTE

Si tienes problemas:
1. Verificar logs del Transaction Service
2. Verificar que la BD esté actualizada
3. Verificar permisos de usuario
4. Revisar consola del navegador (F12)

---

✅ **Sistema de Devoluciones Completamente Funcional**
