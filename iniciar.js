const { spawn } = require('child_process');
const path = require('path');

const services = [
    { name: 'Gateway', command: 'npm', args: ['start'], cwd: 'simple-gateway' },
    { name: 'Auth', command: 'npm', args: ['run', 'iniciar'], cwd: 'backend/services/auth-service' },
    { name: 'Transaction', command: 'npm', args: ['run', 'iniciar'], cwd: 'backend/services/transaction-service' },
    { name: 'Marketing', command: 'npm', args: ['run', 'iniciar'], cwd: 'backend/services/marketing-service' },
    { name: 'Social', command: 'npm', args: ['run', 'iniciar'], cwd: 'backend/services/social-service' },
    { name: 'Catalog', command: 'python', args: ['iniciar.py'], cwd: 'backend/services/catalog-service' },
    { name: 'AI', command: 'python', args: ['iniciar.py'], cwd: 'backend/services/ai-service' },
    { name: 'Frontend', command: 'npm', args: ['run', 'dev'], cwd: 'frontend' }
];

services.forEach(service => {
    console.log(`Iniciando ${service.name}...`);
    const child = spawn(service.command, service.args, {
        cwd: path.join(__dirname, service.cwd),
        shell: true,
        stdio: 'inherit'
    });

    child.on('error', (error) => {
        console.error(`Error al iniciar ${service.name}:`, error);
    });

    child.on('exit', (code) => {
        if (code !== 0) {
            console.log(`${service.name} se detuvo con código ${code}`);
        }
    });
});
