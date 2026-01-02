import subprocess
import time
import os

PUERTO = 3009

print(f"🚛 Iniciando Logistics Service en puerto {PUERTO}...")

try:
    result = subprocess.run(
        f'netstat -ano | findstr :{PUERTO}',
        shell=True,
        capture_output=True,
        text=True
    )
    
    if result.stdout:
        lineas = [l for l in result.stdout.split('\n') if 'LISTENING' in l]
        if lineas:
            pid = lineas[0].strip().split()[-1]
            if pid and pid != '0':
                print(f"🔪 Matando proceso {pid} en puerto {PUERTO}...")
                subprocess.run(f'taskkill /PID {pid} /F', shell=True)
                time.sleep(1)
    
    print("✅ Puerto libre, iniciando servicio...")
    subprocess.run(['python', 'src/main.py'], cwd=os.path.dirname(os.path.abspath(__file__)))
    
except Exception as e:
    print(f"❌ Error: {e}")
    subprocess.run(['python', 'src/main.py'], cwd=os.path.dirname(os.path.abspath(__file__)))
