import asyncio
import motor.motor_asyncio
import os
from datetime import datetime

# Configuración MongoDB Atlas
MONGODB_URI = "mongodb+srv://Vercel-Admin-catalogo:92HI0xaJVpfpogCL@catalogo.eocsgaj.mongodb.net/?retryWrites=true&w=majority"
DATABASE_NAME = "catalogo_db"

# 20 productos de moda
productos_moda = [
    {
        "id": "1",
        "nombre": "Vestido Elegante Negro",
        "descripcion": "Vestido negro clásico perfecto para ocasiones especiales",
        "precio": 89900,
        "categoria": "Vestidos",
        "tallas": ["XS", "S", "M", "L", "XL"],
        "colores": ["Negro", "Azul Marino"],
        "imagen": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop",
        "calificacion": 4.8,
        "stock": 25,
        "marca": "Estilo Premium",
        "material": "Poliéster 95%, Elastano 5%",
        "cuidados": "Lavar en seco",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "2",
        "nombre": "Camisa Blanca Clásica",
        "descripcion": "Camisa blanca de corte clásico, ideal para oficina",
        "precio": 45900,
        "categoria": "Camisas",
        "tallas": ["XS", "S", "M", "L", "XL"],
        "colores": ["Blanco", "Celeste"],
        "imagen": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop",
        "calificacion": 4.5,
        "stock": 40,
        "marca": "Oficina Chic",
        "material": "Algodón 100%",
        "cuidados": "Lavable en máquina",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "3",
        "nombre": "Pantalón Negro Formal",
        "descripcion": "Pantalón negro de corte recto, perfecto para looks profesionales",
        "precio": 67900,
        "categoria": "Pantalones",
        "tallas": ["28", "30", "32", "34", "36"],
        "colores": ["Negro", "Gris Oscuro"],
        "imagen": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
        "calificacion": 4.3,
        "stock": 30,
        "marca": "Formal Style",
        "material": "Lana 70%, Poliéster 30%",
        "cuidados": "Lavar en seco",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "4",
        "nombre": "Blazer Azul Marino",
        "descripcion": "Blazer elegante azul marino, versátil para día y noche",
        "precio": 129900,
        "categoria": "Blazers",
        "tallas": ["XS", "S", "M", "L", "XL"],
        "colores": ["Azul Marino", "Negro", "Gris"],
        "imagen": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
        "calificacion": 4.7,
        "stock": 20,
        "marca": "Executive",
        "material": "Lana 80%, Poliéster 20%",
        "cuidados": "Lavar en seco",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "5",
        "nombre": "Zapatos Tacón Medio",
        "descripcion": "Zapatos elegantes de tacón medio, cómodos para todo el día",
        "precio": 89900,
        "categoria": "Calzado",
        "tallas": ["35", "36", "37", "38", "39", "40"],
        "colores": ["Negro", "Nude", "Rojo"],
        "imagen": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop",
        "calificacion": 4.4,
        "stock": 35,
        "marca": "Comfort Heels",
        "material": "Cuero genuino",
        "cuidados": "Limpiar con paño húmedo",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "6",
        "nombre": "Vestido Floral Primavera",
        "descripcion": "Vestido con estampado floral, perfecto para primavera",
        "precio": 75900,
        "categoria": "Vestidos",
        "tallas": ["XS", "S", "M", "L"],
        "colores": ["Rosa", "Azul", "Verde"],
        "imagen": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop",
        "calificacion": 4.6,
        "stock": 28,
        "marca": "Spring Collection",
        "material": "Viscosa 100%",
        "cuidados": "Lavable en máquina",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "7",
        "nombre": "Jeans Skinny Azul",
        "descripcion": "Jeans de corte skinny, cómodos y modernos",
        "precio": 59900,
        "categoria": "Pantalones",
        "tallas": ["26", "28", "30", "32", "34"],
        "colores": ["Azul Claro", "Azul Oscuro", "Negro"],
        "imagen": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop",
        "calificacion": 4.2,
        "stock": 45,
        "marca": "Denim Co",
        "material": "Algodón 98%, Elastano 2%",
        "cuidados": "Lavable en máquina",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "8",
        "nombre": "Blusa Seda Rosa",
        "descripcion": "Blusa de seda natural en tono rosa suave",
        "precio": 95900,
        "categoria": "Camisas",
        "tallas": ["XS", "S", "M", "L"],
        "colores": ["Rosa", "Blanco", "Champagne"],
        "imagen": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=500&fit=crop",
        "calificacion": 4.9,
        "stock": 15,
        "marca": "Silk Luxury",
        "material": "Seda 100%",
        "cuidados": "Lavar en seco",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "9",
        "nombre": "Falda Plisada Midi",
        "descripcion": "Falda plisada de largo midi, elegante y versátil",
        "precio": 52900,
        "categoria": "Faldas",
        "tallas": ["XS", "S", "M", "L", "XL"],
        "colores": ["Negro", "Gris", "Azul Marino"],
        "imagen": "https://images.unsplash.com/photo-1583496661160-fb5886a13d27?w=400&h=500&fit=crop",
        "calificacion": 4.3,
        "stock": 32,
        "marca": "Classic Style",
        "material": "Poliéster 100%",
        "cuidados": "Lavable en máquina",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "10",
        "nombre": "Chaqueta Cuero Negro",
        "descripcion": "Chaqueta de cuero genuino, estilo motociclista",
        "precio": 189900,
        "categoria": "Chaquetas",
        "tallas": ["S", "M", "L", "XL"],
        "colores": ["Negro", "Marrón"],
        "imagen": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop",
        "calificacion": 4.8,
        "stock": 12,
        "marca": "Leather Pro",
        "material": "Cuero genuino 100%",
        "cuidados": "Tratamiento especial cuero",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "11",
        "nombre": "Sneakers Blancos",
        "descripcion": "Sneakers blancos minimalistas, perfectos para looks casuales",
        "precio": 79900,
        "categoria": "Calzado",
        "tallas": ["35", "36", "37", "38", "39", "40", "41"],
        "colores": ["Blanco", "Blanco/Rosa", "Blanco/Azul"],
        "imagen": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop",
        "calificacion": 4.5,
        "stock": 50,
        "marca": "Urban Walk",
        "material": "Cuero sintético",
        "cuidados": "Limpiar con paño húmedo",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "12",
        "nombre": "Suéter Lana Gris",
        "descripcion": "Suéter de lana merino, suave y abrigador",
        "precio": 85900,
        "categoria": "Suéteres",
        "tallas": ["XS", "S", "M", "L", "XL"],
        "colores": ["Gris", "Beige", "Azul Marino"],
        "imagen": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop",
        "calificacion": 4.6,
        "stock": 25,
        "marca": "Wool Comfort",
        "material": "Lana Merino 100%",
        "cuidados": "Lavar a mano",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "13",
        "nombre": "Vestido Cóctel Rojo",
        "descripcion": "Vestido rojo para eventos especiales y cócteles",
        "precio": 119900,
        "categoria": "Vestidos",
        "tallas": ["XS", "S", "M", "L"],
        "colores": ["Rojo", "Negro", "Azul Real"],
        "imagen": "https://images.unsplash.com/photo-1566479179817-c0ae8e5b4b5e?w=400&h=500&fit=crop",
        "calificacion": 4.7,
        "stock": 18,
        "marca": "Evening Glam",
        "material": "Poliéster 90%, Elastano 10%",
        "cuidados": "Lavar en seco",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "14",
        "nombre": "Pantalón Palazzo Beige",
        "descripcion": "Pantalón palazzo de tiro alto, cómodo y elegante",
        "precio": 64900,
        "categoria": "Pantalones",
        "tallas": ["XS", "S", "M", "L", "XL"],
        "colores": ["Beige", "Negro", "Blanco"],
        "imagen": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
        "calificacion": 4.4,
        "stock": 35,
        "marca": "Flow Style",
        "material": "Viscosa 95%, Elastano 5%",
        "cuidados": "Lavable en máquina",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "15",
        "nombre": "Cardigan Oversized",
        "descripcion": "Cardigan oversized perfecto para capas y looks relajados",
        "precio": 72900,
        "categoria": "Cardigans",
        "tallas": ["S", "M", "L"],
        "colores": ["Camel", "Gris", "Crema"],
        "imagen": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop",
        "calificacion": 4.5,
        "stock": 22,
        "marca": "Cozy Knits",
        "material": "Acrílico 70%, Lana 30%",
        "cuidados": "Lavable en máquina",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "16",
        "nombre": "Botas Altas Negras",
        "descripcion": "Botas altas hasta la rodilla, elegantes y versátiles",
        "precio": 149900,
        "categoria": "Calzado",
        "tallas": ["35", "36", "37", "38", "39", "40"],
        "colores": ["Negro", "Marrón", "Gris"],
        "imagen": "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=500&fit=crop",
        "calificacion": 4.6,
        "stock": 20,
        "marca": "Boot Elegance",
        "material": "Cuero genuino",
        "cuidados": "Tratamiento especial cuero",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "17",
        "nombre": "Top Crop Blanco",
        "descripcion": "Top crop básico blanco, perfecto para combinar",
        "precio": 29900,
        "categoria": "Tops",
        "tallas": ["XS", "S", "M", "L"],
        "colores": ["Blanco", "Negro", "Gris"],
        "imagen": "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=500&fit=crop",
        "calificacion": 4.2,
        "stock": 60,
        "marca": "Basic Essentials",
        "material": "Algodón 95%, Elastano 5%",
        "cuidados": "Lavable en máquina",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "18",
        "nombre": "Abrigo Largo Camel",
        "descripcion": "Abrigo largo en tono camel, elegante para invierno",
        "precio": 199900,
        "categoria": "Abrigos",
        "tallas": ["S", "M", "L", "XL"],
        "colores": ["Camel", "Negro", "Gris"],
        "imagen": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=500&fit=crop",
        "calificacion": 4.8,
        "stock": 15,
        "marca": "Winter Luxury",
        "material": "Lana 80%, Cachemira 20%",
        "cuidados": "Lavar en seco",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "19",
        "nombre": "Shorts Denim Azul",
        "descripcion": "Shorts de denim con dobladillo, perfectos para verano",
        "precio": 39900,
        "categoria": "Shorts",
        "tallas": ["26", "28", "30", "32", "34"],
        "colores": ["Azul Claro", "Azul Medio", "Blanco"],
        "imagen": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=500&fit=crop",
        "calificacion": 4.3,
        "stock": 40,
        "marca": "Summer Denim",
        "material": "Algodón 100%",
        "cuidados": "Lavable en máquina",
        "fecha_creacion": datetime.now().isoformat()
    },
    {
        "id": "20",
        "nombre": "Sandalias Tacón Dorado",
        "descripcion": "Sandalias elegantes con tacón y detalles dorados",
        "precio": 69900,
        "categoria": "Calzado",
        "tallas": ["35", "36", "37", "38", "39", "40"],
        "colores": ["Dorado", "Plateado", "Negro"],
        "imagen": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop",
        "calificacion": 4.4,
        "stock": 30,
        "marca": "Golden Steps",
        "material": "Cuero sintético",
        "cuidados": "Limpiar con paño seco",
        "fecha_creacion": datetime.now().isoformat()
    }
]

async def poblar_productos():
    try:
        # Conectar a MongoDB Atlas
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        
        print("Conectando a MongoDB...")
        
        # Limpiar colección existente
        await db.productos.delete_many({})
        print("Productos anteriores eliminados")
        
        # Insertar nuevos productos
        resultado = await db.productos.insert_many(productos_moda)
        print(f"{len(resultado.inserted_ids)} productos insertados exitosamente")
        
        # Verificar inserción
        total = await db.productos.count_documents({})
        print(f"Total de productos en la base de datos: {total}")
        
        # Mostrar algunos productos
        productos_muestra = await db.productos.find({}).limit(3).to_list(length=3)
        print("\nProductos de muestra:")
        for producto in productos_muestra:
            print(f"   - {producto['nombre']} - ${producto['precio']:,}")
        
        client.close()
        print("\nProductos poblados exitosamente!")
        
    except Exception as e:
        print(f"Error poblando productos: {e}")

if __name__ == "__main__":
    asyncio.run(poblar_productos())