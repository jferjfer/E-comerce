import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de Cloudinary desde variables de entorno
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "dhwk5p0wn"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "436986674926171"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "-IBjmELXn90c8ob3NMHfAW9mqhE"),
    secure=True
)

print("✅ Cloudinary configurado correctamente")
