#!/usr/bin/env python3
import psycopg2
import bcrypt
import sys

print("🚀 Iniciando configuración del sistema de devoluciones...\n")

# Configuración de bases de datos
DB_AUTH = "postgresql://neondb_owner:npg_zRdlv7TGEJu3@ep-red-voice-adzfb730-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
DB_TRANSACTION = "postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

# ============================================
# 1. ACTUALIZAR TABLA DEVOLUCION
# ============================================
print("📊 Paso 1: Actualizando tabla devolucion...")
try:
    conn = psycopg2.connect(DB_TRANSACTION)
    cur = conn.cursor()
    
    # Agregar columnas
    cur.execute("""
        ALTER TABLE devolucion 
        ADD COLUMN IF NOT EXISTS comentario_aprobacion TEXT,
        ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
        ADD COLUMN IF NOT EXISTS comentario_completado TEXT;
    """)
    
    # Actualizar constraint
    cur.execute("ALTER TABLE devolucion DROP CONSTRAINT IF EXISTS devolucion_estado_check;")
    cur.execute("""
        ALTER TABLE devolucion 
        ADD CONSTRAINT devolucion_estado_check 
        CHECK (estado IN ('Solicitada', 'Aprobada', 'Rechazada', 'Completada'));
    """)
    
    conn.commit()
    
    # Verificar
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'devolucion' 
        ORDER BY ordinal_position
    """)
    
    print("✅ Tabla devolucion actualizada:")
    for row in cur.fetchall():
        print(f"   - {row[0]}: {row[1]}")
    
    cur.close()
    conn.close()
    print()
    
except Exception as e:
    print(f"❌ Error actualizando tabla: {e}")
    sys.exit(1)

# ============================================
# 2. CREAR USUARIOS
# ============================================
print("👥 Paso 2: Creando usuarios...")

usuarios = [
    {
        'nombre': 'Customer Success Manager',
        'email': 'customersuccess@estilomoda.com',
        'contrasena': 'admin123',
        'rol': 'customer_success',
        'telefono': '3001234567'
    },
    {
        'nombre': 'Logistics Coordinator',
        'email': 'logistics@estilomoda.com',
        'contrasena': 'admin123',
        'rol': 'logistics_coordinator',
        'telefono': '3001234568'
    }
]

try:
    conn = psycopg2.connect(DB_AUTH)
    cur = conn.cursor()
    
    for usuario in usuarios:
        # Verificar si existe
        cur.execute("SELECT id FROM usuario WHERE email = %s", (usuario['email'],))
        existe = cur.fetchone()
        
        if existe:
            print(f"⚠️  {usuario['email']} ya existe (ID: {existe[0]})")
            continue
        
        # Hash de contraseña
        hash_pass = bcrypt.hashpw(usuario['contrasena'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insertar
        cur.execute("""
            INSERT INTO usuario (nombre, email, contrasena, rol, telefono, activo)
            VALUES (%s, %s, %s, %s, %s, true)
            RETURNING id, nombre, email, rol
        """, (usuario['nombre'], usuario['email'], hash_pass, usuario['rol'], usuario['telefono']))
        
        resultado = cur.fetchone()
        print(f"✅ Usuario creado:")
        print(f"   Nombre: {resultado[1]}")
        print(f"   Email: {resultado[2]}")
        print(f"   Rol: {resultado[3]}")
        print(f"   ID: {resultado[0]}\n")
    
    conn.commit()
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error creando usuarios: {e}")
    sys.exit(1)

# ============================================
# RESUMEN FINAL
# ============================================
print("\n" + "="*60)
print("✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE")
print("="*60)
print("\n📋 Credenciales de acceso:\n")
print("Customer Success:")
print("  Email: customersuccess@estilomoda.com")
print("  Password: admin123")
print("  Rol: customer_success\n")
print("Logistics Coordinator:")
print("  Email: logistics@estilomoda.com")
print("  Password: admin123")
print("  Rol: logistics_coordinator\n")
print("="*60)
print("\n🎯 Próximos pasos:")
print("1. Reiniciar Transaction Service")
print("2. Reiniciar Frontend")
print("3. Probar el flujo completo\n")
