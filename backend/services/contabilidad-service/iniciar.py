import subprocess
import os

PUERTO = int(os.getenv("PUERTO", 3012))
print(f"📊 Iniciando Contabilidad Service en puerto {PUERTO}...")

subprocess.run(
    ['uvicorn', 'src.main:app', '--host', '0.0.0.0', '--port', str(PUERTO)],
    cwd=os.path.dirname(os.path.abspath(__file__))
)
