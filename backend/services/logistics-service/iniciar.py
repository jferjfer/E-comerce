import subprocess
import os

PUERTO = int(os.getenv("PUERTO", 3009))

print(f"🚛 Iniciando Logistics Service en puerto {PUERTO}...")

subprocess.run(
    ['uvicorn', 'src.main:app', '--host', '0.0.0.0', '--port', str(PUERTO)],
    cwd=os.path.dirname(os.path.abspath(__file__))
)
