# 🚀 DESPLIEGUE AUTOMÁTICO EN ORACLE CLOUD

## 📋 PASOS RÁPIDOS

### 1. Generar SSH Key
```bash
cd /home/jose/E-comerce/deploy
chmod +x 1-generar-ssh-key.sh
./1-generar-ssh-key.sh
```

**Copia la clave pública que aparece en pantalla**

---

### 2. Crear VM en Oracle Cloud

1. Ve a: https://cloud.oracle.com
2. Login → Compute → Instances → **Create Instance**
3. Configuración:
   - **Name:** estilo-moda-ecommerce
   - **Image:** Ubuntu 22.04
   - **Shape:** VM.Standard.E2.1.Micro (Free Tier)
   - **SSH Keys:** Pega la clave pública del paso 1
   - **Boot Volume:** 50 GB
4. Click **Create**
5. Espera 2-3 minutos
6. **Copia la IP pública** (ejemplo: 150.230.45.123)

---

### 3. Configurar Firewall en Oracle

1. Networking → Virtual Cloud Networks → Tu VCN
2. Security Lists → Default Security List
3. **Add Ingress Rules:**

| Source | Protocol | Port | Description |
|--------|----------|------|-------------|
| 0.0.0.0/0 | TCP | 22 | SSH |
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |
| 0.0.0.0/0 | TCP | 3000 | Gateway |
| 0.0.0.0/0 | TCP | 3005 | Frontend |

---

### 4. Desplegar Automáticamente

```bash
# Editar script con tu IP
nano deploy/DEPLOY-COMPLETO.sh
# Cambiar: VM_IP="TU_IP_AQUI" por VM_IP="150.230.45.123"
# Guardar: Ctrl+O, Enter, Ctrl+X

# Ejecutar despliegue completo
chmod +x deploy/DEPLOY-COMPLETO.sh
./deploy/DEPLOY-COMPLETO.sh
```

**Esto hará TODO automáticamente:**
- ✅ Copia el proyecto a la VM
- ✅ Instala Docker y Docker Compose
- ✅ Configura firewall
- ✅ Construye las imágenes
- ✅ Levanta todos los servicios

**Tiempo total: 15-20 minutos**

---

### 5. Acceder a tu Aplicación

```
Frontend: http://TU_IP:3005
API: http://TU_IP:3000
```

**Usuarios demo:**
- demo@estilomoda.com / admin123
- ceo@estilomoda.com / admin123

---

## 🔧 COMANDOS ÚTILES

### Conectar a la VM
```bash
ssh -i ~/.ssh/oracle_key ubuntu@TU_IP
```

### Ver logs
```bash
ssh -i ~/.ssh/oracle_key ubuntu@TU_IP
cd E-comerce
docker-compose logs -f
```

### Reiniciar servicios
```bash
ssh -i ~/.ssh/oracle_key ubuntu@TU_IP
cd E-comerce
docker-compose restart
```

### Detener todo
```bash
ssh -i ~/.ssh/oracle_key ubuntu@TU_IP
cd E-comerce
docker-compose down
```

---

## 🆘 TROUBLESHOOTING

### Error: "Permission denied (publickey)"
```bash
chmod 400 ~/.ssh/oracle_key
```

### Error: "Port already in use"
```bash
ssh -i ~/.ssh/oracle_key ubuntu@TU_IP
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Reconstruir todo
```bash
ssh -i ~/.ssh/oracle_key ubuntu@TU_IP
cd E-comerce
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 📞 SOPORTE

Si algo falla, revisa los logs:
```bash
ssh -i ~/.ssh/oracle_key ubuntu@TU_IP
cd E-comerce
docker-compose logs
```
