#!/bin/bash

echo "🧪 Ejecutando Pruebas del Proyecto E-Commerce"
echo "=============================================="
echo ""

# Verificar que los servicios estén corriendo
echo "📋 Verificando servicios..."
if ! curl -s http://localhost:3000/salud > /dev/null; then
    echo "❌ Error: Los servicios no están corriendo"
    echo "   Ejecuta: docker compose up -d"
    exit 1
fi

echo "✅ Servicios activos"
echo ""

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Ejecutar pruebas
echo "🧪 Ejecutando pruebas unitarias..."
npm test -- tests/unit/

echo ""
echo "🔗 Ejecutando pruebas de integración..."
npm test -- tests/integration/

echo ""
echo "🎯 Ejecutando pruebas E2E..."
npm test -- tests/e2e/

echo ""
echo "📊 Generando reporte de cobertura..."
npm test -- --coverage

echo ""
echo "✅ Pruebas completadas"
