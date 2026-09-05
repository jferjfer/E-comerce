/**
 * Módulo compartido de métricas Prometheus — EGOS
 * Uso: const { registrarMetricas } = require('../shared/metricas')
 *      registrarMetricas(app, 'auth-service')
 */
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'egos_node_' });

const httpRequestsTotal = new client.Counter({
  name: 'egos_http_requests_total',
  help: 'Total de requests HTTP',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'egos_http_request_duration_seconds',
  help: 'Duración de requests HTTP en segundos',
  labelNames: ['method', 'route', 'status', 'service'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

const httpRequestsActivos = new client.Gauge({
  name: 'egos_http_requests_active',
  help: 'Requests HTTP activos en este momento',
  labelNames: ['service'],
  registers: [register]
});

function middlewareMetricas(serviceName) {
  return (req, res, next) => {
    if (req.path === '/metrics' || req.path === '/salud') return next();
    const inicio = Date.now();
    httpRequestsActivos.inc({ service: serviceName });
    res.on('finish', () => {
      const duracion = (Date.now() - inicio) / 1000;
      const route = req.route?.path || req.path.replace(/\/\d+/g, '/:id') || 'unknown';
      httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode, service: serviceName });
      httpRequestDuration.observe({ method: req.method, route, status: res.statusCode, service: serviceName }, duracion);
      httpRequestsActivos.dec({ service: serviceName });
    });
    next();
  };
}

function registrarMetricas(app, serviceName) {
  app.use(middlewareMetricas(serviceName));
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (e) {
      res.status(500).end(e.message);
    }
  });
  console.log(`📊 Métricas Prometheus habilitadas en /metrics [${serviceName}]`);
}

module.exports = { registrarMetricas, middlewareMetricas, register, client };
