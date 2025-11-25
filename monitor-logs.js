#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📊 Monitor de Logs - Estilo y Moda\n');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
  console.log('✅ Directorio de logs creado');
}

// Función para escribir logs con timestamp
function writeLog(service, level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    service,
    level,
    message,
    data
  };
  
  const logFile = path.join(logsDir, `${service}-${new Date().toISOString().split('T')[0]}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFileSync(logFile, logLine);
  
  // También mostrar en consola con colores
  const colors = {
    ERROR: '\x1b[31m', // Rojo
    WARN: '\x1b[33m',  // Amarillo
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[90m'  // Gris
  };
  
  const reset = '\x1b[0m';
  const color = colors[level] || colors.INFO;
  
  console.log(`${color}[${timestamp}] ${service.toUpperCase()} - ${level}: ${message}${reset}`);
  if (data) {
    console.log(`${color}   └─ Data:${reset}`, data);
  }
}

// Exportar función para uso en servicios
global.logError = (service, message, data) => writeLog(service, 'ERROR', message, data);
global.logWarn = (service, message, data) => writeLog(service, 'WARN', message, data);
global.logInfo = (service, message, data) => writeLog(service, 'INFO', message, data);
global.logDebug = (service, message, data) => writeLog(service, 'DEBUG', message, data);

// Función para leer logs recientes
function readRecentLogs(service = null, hours = 1) {
  const files = fs.readdirSync(logsDir);
  const logFiles = files.filter(f => f.endsWith('.log'));
  
  if (service) {
    logFiles = logFiles.filter(f => f.startsWith(service));
  }
  
  const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
  const recentLogs = [];
  
  logFiles.forEach(file => {
    const content = fs.readFileSync(path.join(logsDir, file), 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      try {
        const log = JSON.parse(line);
        if (new Date(log.timestamp) > cutoffTime) {
          recentLogs.push(log);
        }
      } catch (e) {
        // Ignorar líneas malformadas
      }
    });
  });
  
  return recentLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Comando para mostrar logs recientes
if (require.main === module) {
  const args = process.argv.slice(2);
  const service = args[0];
  const hours = parseInt(args[1]) || 1;
  
  console.log(`📋 Logs recientes (últimas ${hours} horas)${service ? ` para ${service}` : ''}:\n`);
  
  const logs = readRecentLogs(service, hours);
  
  if (logs.length === 0) {
    console.log('No hay logs recientes');
  } else {
    logs.forEach(log => {
      writeLog(log.service, log.level, log.message, log.data);
    });
  }
  
  console.log(`\n📊 Total de logs: ${logs.length}`);
  console.log(`📁 Directorio de logs: ${logsDir}`);
}

module.exports = { writeLog, readRecentLogs };