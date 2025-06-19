require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createPrometheusMetrics } = require('./metrics');
const bucketRoute = require('./routes/bucket.route')
const parameterRoute = require('./routes/parameter.route')
const healthRoute = require('./routes/health.route')
const versionRoute = require('./routes/version.route')

const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(helmet()); 
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Prometheus metrics
const { register, httpRequestDuration, httpRequestsTotal } = createPrometheusMetrics();

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
 
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
      duration
    );
    httpRequestsTotal.inc({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });
 
  next();
});



app.use('/health', healthRoute);
app.use('/version', versionRoute);
app.use('/aws/s3/buckets', bucketRoute);
app.use('/aws/parameters', parameterRoute);


// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    service: 'auxiliary-service',
    version: process.env.SERVICE_VERSION,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    service: 'auxiliary-service',
    version: process.env.SERVICE_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Auxiliary service running on port ${PORT}`);
});