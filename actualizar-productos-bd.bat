@echo off
echo 🔄 Actualizando base de datos de productos en Vercel...
echo.

REM Ejecutar script de actualización en MongoDB Atlas (Vercel)
mongosh "mongodb+srv://Vercel-Admin-catalogo:92HI0xaJVpfpogCL@catalogo.eocsgaj.mongodb.net/catalogo_db" --file "backend/database/mongodb/actualizar_productos.js"

echo.
echo ✅ Base de datos de Vercel actualizada exitosamente
echo 📦 La colección 'productos' ahora tiene todos los campos necesarios
echo 🌐 Cambios aplicados en producción
echo.
pause