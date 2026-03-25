#!/usr/bin/env python3
"""
Script de prueba para verificar la implementación de ICON
"""

import requests
import json
import sys

API_URL = "http://localhost:3000"

def test_avatar_demo():
    """Prueba el endpoint de avatar demo"""
    print("🧪 Probando endpoint /api/avatar/demo...")
    
    try:
        response = requests.post(
            f"{API_URL}/api/avatar/demo",
            json={"producto_url": "https://res.cloudinary.com/demo/image/upload/sample.jpg"},
            timeout=30
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Respuesta exitosa:")
            print(json.dumps(data, indent=2))
            
            # Verificar campos importantes
            if "avatar_url" in data:
                print(f"\n✅ Avatar URL: {data['avatar_url']}")
            if "avatar" in data and "personalizado" in data["avatar"]:
                personalizado = data["avatar"]["personalizado"]
                print(f"{'✅' if personalizado else '⚠️'} Personalizado: {personalizado}")
            if "avatar" in data and "provider" in data["avatar"]:
                print(f"✅ Provider: {data['avatar']['provider']}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_avatar_animaciones():
    """Prueba el endpoint de animaciones"""
    print("\n🧪 Probando endpoint /api/avatar/animaciones...")
    
    try:
        response = requests.get(f"{API_URL}/api/avatar/animaciones", timeout=10)
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Animaciones disponibles:")
            for anim in data.get("animaciones", []):
                print(f"  - {anim.get('nombre')}: {anim.get('descripcion')}")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_gateway_health():
    """Verifica que el gateway esté funcionando"""
    print("\n🧪 Verificando gateway...")
    
    try:
        response = requests.get(f"{API_URL}/salud", timeout=5)
        if response.status_code == 200:
            print("✅ Gateway funcionando")
        else:
            print(f"⚠️ Gateway responde con: {response.status_code}")
    except Exception as e:
        print(f"❌ Gateway no disponible: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 PRUEBA DE IMPLEMENTACIÓN ICON")
    print("=" * 60)
    
    test_gateway_health()
    test_avatar_animaciones()
    test_avatar_demo()
    
    print("\n" + "=" * 60)
    print("✅ Pruebas completadas")
    print("=" * 60)
