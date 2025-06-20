### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node.js environment | `production` |
| `LOG_LEVEL` | Logging level | `info` |
| `AWS_ACCESS_KEY_ID` | AWS access key (if not using IAM roles) | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (if not using IAM roles) | - |

## Project Structure

```
auxiliary-service/
├── controllers/
│   ├── bucket.controller.js       # S3 bucket operations
│   ├── parameter.controller.js    # Parameter Store operations
│   └── health.controller.js       # Health check operations
├── routes/
│   ├── bucket.route.js            # S3 bucket routes
│   ├── parameter.route.js         # Parameter Store routes
│   ├── health.route.js            # Health check routes
│   └── version.route.js           # Version information route
├── utils/
│   └── index.js                   # AWS API utility functions
├── metrics/
│   └── index.js                   # Prometheus metrics setup
├── index.js                       # Main application entry point
├── package.json                   # Node.js dependencies
├── Dockerfile                     # Container configuration
├── .dockerignore                  # Docker build exclusions
├── .env.example                   # Environment variable template
└── README.m# Auxiliary Service - Node.js AWS API

A lightweight Node.js microservice for interacting with AWS services including S3 and Systems Manager Parameter Store. This service provides RESTful APIs for listing S3 buckets, managing parameters, and health checks with built-in AWS SDK integration and error handling.

## Features

- **S3 Integration**: List and interact with S3 buckets
- **Parameter Store Management**: Retrieve and manage AWS Systems Manager parameters
- **Health Checks**: Kubernetes-ready health and readiness endpoints
- **AWS SDK v3**: Modern AWS SDK with efficient connection management
- **Error Handling**: Comprehensive error handling with detailed logging
- **Environment-based Configuration**: Flexible configuration through environment variables
- **Production-ready**: Structured responses, logging, and monitoring support

## Architecture

```

┌─────────────────────────────────────────────────────────────┐
│                    Auxiliary Service                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   S3 Handler    │  │  Parameter      │  │   Health     │ │
│  │                 │  │   Handler       │  │   Handler    │ │
│  │ • listBucket()  │  │ • listParams()  │  │ • readiness()│ │
│  │                 │  │ • getParam()    │  │ • liveness() │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│           │                     │                    │      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 AWS SDK Clients                        │ │
│  │  ┌─────────────┐           ┌─────────────────────────┐  │ │
│  │  │ S3Client    │           │      SSMClient          │  │ │
│  │  │             │           │                         │  │ │
│  │  └─────────────┘           └─────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────┐
│                         AWS Services                         │
│  ┌─────────────────┐        │        ┌──────────────────────┐ │
│  │   Amazon S3     │        │        │  Systems Manager     │ │
│  │                 │        │        │  Parameter Store     │ │
│  │ • Buckets       │        │        │                      │ │
│  │ • Objects       │        │        │ • String Parameters  │ │
│  │ • Metadata      │        │        │ • SecureString Params│ │
│  └─────────────────┘        │        └──────────────────────┘ │
└──────────────────────────────┼───────────────────────────────┘

```

## API Endpoints

### Core Service Endpoints

#### Version Information
```http
GET /version
```

**Response:**

```json
{
  "version": "1.0.0",
  "service": "auxiliary-service",
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

#### Health Checks

```http
GET /health
```

**Response:**

```json
"OK"
```

#### Readiness Check

```http
GET /health/ready
```

**Successful Response:**

```json
{
  "status": "ready",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "version": "1.0.0",
  "service": "auxiliary-service"
}
```

**Failed Response:**

```json
{
  "status": "not ready",
  "error": "AWS services not available",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "version": "1.0.0",
  "service": "auxiliary-service"
}
```

#### Prometheus Metrics

```http
GET /metrics
```

**Response:**

```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1",method="GET",route="/aws/s3/buckets",status_code="200",app="auxiliary-service"} 1
http_request_duration_seconds_bucket{le="0.3",method="GET",route="/aws/s3/buckets",status_code="200",app="auxiliary-service"} 1
...
```

### AWS Operations

#### List S3 Buckets

```http
GET /aws/s3/buckets
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name": "my-application-bucket",
      "creationDate": "2023-01-15T10:30:00.000Z"
    },
    {
      "name": "my-backup-bucket",
      "creationDate": "2023-02-20T14:45:00.000Z"
    }
  ],
  "count": 2,
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

#### List Parameters by Project

```http
GET /aws/parameters/list
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name": "/myproject/database/host",
      "type": "String",
      "value": "db.example.com",
      "version": 1,
      "lastModifiedDate": "2023-11-15T09:30:00.000Z"
    },
    {
      "name": "/myproject/api/secret",
      "type": "SecureString",
      "value": "[ENCRYPTED]",
      "version": 2,
      "lastModifiedDate": "2023-11-20T16:20:00.000Z"
    }
  ],
  "count": 2,
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

#### Get Specific Parameter

```http
GET /aws/parameters?name=database/host
```

**Response:**

```json
{
  "success": true,
  "data": {
    "name": "/myproject/database/host",
    "value": "db.example.com",
    "type": "String",
    "version": 1,
    "lastModifiedDate": "2023-11-15T09:30:00.000Z",
    "dataType": "text"
  },
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

## Code Structure

### Express Application (`index.js`)

```javascript
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

// Routes
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
```

### Routes

#### Bucket Route (`routes/bucket.route.js`)

```javascript
const express = require('express')
const { listBucket } = require('../controllers/bucket.controller')
const router = express.Router()

router.get('/', listBucket)

module.exports = router
```

#### Parameter Route (`routes/parameter.route.js`)

```javascript
const express = require('express')
const { listParameters, getParameterValue } = require('../controllers/parameter.controller')
const router = express.Router()

router.get('/list', listParameters)
router.get('/', getParameterValue)

module.exports = router
```

#### Health Route (`routes/health.route.js`)

```javascript
const express = require('express')
const { checkReadiness } = require('../controllers/health.controller')
const router = express.Router()

router.get('/', (req, res) => res.send('OK'));
router.get('/ready', checkReadiness)

module.exports = router
```

#### Version Route (`routes/version.route.js`)

```javascript
const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.json({
        version: process.env.SERVICE_VERSION,
        service: 'auxiliary-service',
        timestamp: new Date().toISOString(),
    });
})

module.exports = router
```

### Controllers

### S3 Controller (`controllers/bucket.controller.js`)

```javascript
const { ListBucketsCommand, S3Client } = require("@aws-sdk/client-s3");
const { callAWSAPI } = require("../utils");

const s3Client = new S3Client({ region: process.env.AWS_REGION});

async function listBucket(req, res) {
  try {   
    const command = new ListBucketsCommand({});
    const response = await callAWSAPI('s3', () => s3Client.send(command));
   
    const buckets = response.Buckets.map(bucket => ({
      name: bucket.Name,
      creationDate: bucket.CreationDate,
    }));
   
    console.log(`Successfully retrieved ${buckets.length} S3 buckets`);
   
    res.json({
      success: true,
      data: buckets,
      count: buckets.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching S3 buckets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch S3 buckets',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = { listBucket };
```

#### Parameter Controller (`controllers/parameter.controller.js`)

```javascript
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require("@aws-sdk/client-ssm");
const { callAWSAPI } = require("../utils");

const PROJECT_NAME = process.env.PROJECT_NAME;
const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

async function listParameters(req, res) {
  try {
    const parameterPath = `/${PROJECT_NAME}/`;
    const parameters = [];
    const command = new GetParametersByPathCommand({
      Path: parameterPath,
      Recursive: true,
      WithDecryption: false,
    });

    const response = await callAWSAPI('ssm', () => ssmClient.send(command));
   
    if (response.Parameters) {
      parameters.push(...response.Parameters.map(param => ({
        name: param.Name,
        type: param.Type,
        value: param.Value,
        version: param.Version,
        lastModifiedDate: param.LastModifiedDate,
      })));
    }
   
    res.json({
      success: true,
      data: parameters,
      count: parameters.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching parameters:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch parameters',
      timestamp: new Date().toISOString()
    });
  }
}

async function getParameterValue(req, res) {
  try {
    const parameterName = req.query.name;
    const fullParameterName = `/${PROJECT_NAME}/${parameterName}`;
   
    const command = new GetParameterCommand({
      Name: fullParameterName,
      WithDecryption: true
    });
   
    const response = await callAWSAPI('ssm', () => ssmClient.send(command));
   
    const parameter = {
      name: response.Parameter.Name,
      value: response.Parameter.Value,
      type: response.Parameter.Type,
      version: response.Parameter.Version,
      lastModifiedDate: response.Parameter.LastModifiedDate,
      dataType: response.Parameter.DataType
    };
   
    res.json({
      success: true,
      data: parameter,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.name === 'ParameterNotFound') {
      res.status(404).json({
        success: false,
        error: `Parameter '${req.query.name}' not found`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch parameter',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = { listParameters, getParameterValue };
```

#### Health Controller (`controllers/health.controller.js`)

```javascript
const { ListBucketsCommand, S3Client } = require("@aws-sdk/client-s3");
const { callAWSAPI } = require("../utils");

const s3Client = new S3Client({ region: process.env.AWS_REGION });

async function checkReadiness(req, res) {
  try {
    // Test AWS connectivity
    await callAWSAPI('s3', () => s3Client.send(new ListBucketsCommand({})));
   
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      version: process.env.SERVICE_VERSION,
      service: 'auxiliary-service',
    });
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      error: 'AWS services not available',
      timestamp: new Date().toISOString(),
      version: process.env.SERVICE_VERSION,
      service: 'auxiliary-service'
    });
  }
}

module.exports = { checkReadiness };
```

### Utilities

#### AWS API Utility (`utils/index.js`)

```javascript
const { createPrometheusMetrics } = require("../metrics");

const { awsApiCalls } = createPrometheusMetrics();

async function callAWSAPI(apiName, apiCall) {
  const start = Date.now();
  try {
    const result = await apiCall();
    const duration = (Date.now() - start) / 1000;
    awsApiCalls.observe({ service: apiName, status: 'success' }, duration);
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    awsApiCalls.observe({ service: apiName, status: 'error' }, duration);
    throw error;
  }
}

module.exports = { callAWSAPI };
```

#### Prometheus Metrics (`metrics/index.js`)

```javascript
const client = require('prom-client');

// Singleton pattern to ensure metrics are only created once
let metricsInstance = null;

function createPrometheusMetrics() {
  // Return existing instance if already created
  if (metricsInstance) {
    return metricsInstance;
  }

  // Create a Registry to register the metrics
  const register = new client.Registry();

  // Add a default label which is added to all metrics
  register.setDefaultLabels({
    app: 'auxiliary-service'
  });

  // Enable the collection of default metrics
  client.collectDefaultMetrics({ register });

  // Create custom metrics
  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });

  const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  });

  const awsApiCalls = new client.Histogram({
    name: 'aws_api_call_duration_seconds',
    help: 'Duration of AWS API calls in seconds',
    labelNames: ['service', 'status'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });

  // Register custom metrics
  register.registerMetric(httpRequestDuration);
  register.registerMetric(httpRequestsTotal);
  register.registerMetric(awsApiCalls);

  // Cache the instance
  metricsInstance = {
    register,
    httpRequestDuration,
    httpRequestsTotal,
    awsApiCalls
  };

  return metricsInstance;
}

module.exports = { createPrometheusMetrics };
```

## Environment Variables

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for service operations | `us-west-2` |
| `PROJECT_NAME` | Project name for parameter store path | `myproject` |
| `SERVICE_VERSION` | Service version for health checks | `1.0.0` |
| `PORT` | Port for the service to listen on | `3000` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node.js environment | `production` |
| `LOG_LEVEL` | Logging level | `info` |
| `AWS_ACCESS_KEY_ID` | AWS access key (if not using IAM roles) | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (if not using IAM roles) | - |

## Docker Configuration

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

FROM node:18-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy application files
COPY --chown=nodejs:nodejs . .
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
```

### .dockerignore

```dockerignore
# Dependencies
node_modules/
npm-debug.log*

# Environment files
.env
.env.local
.env.*.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Git
.git/
.gitignore

# Documentation
README.md
docs/

# Testing
test/
coverage/
*.test.js
*.spec.js

# Build artifacts
dist/
build/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Docker
Dockerfile*
docker-compose*
.dockerignore
```

## Package.json Configuration

```json
{
  "name": "auxiliary-service",
  "version": "1.0.0",
  "description": "AWS auxiliary service for S3 and Parameter Store operations",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "docker:build": "docker build -t auxiliary-service .",
    "docker:run": "docker run -p 3000:3000 --env-file .env auxiliary-service"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.450.0",
    "@aws-sdk/client-ssm": "^3.450.0",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.54.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "aws",
    "s3",
    "parameter-store",
    "microservice",
    "nodejs",
    "kubernetes"
  ]
}
```

## Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auxiliary-service
  namespace: production
  labels:
    app: auxiliary-service
    version: v1.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auxiliary-service
  template:
    metadata:
      labels:
        app: auxiliary-service
        version: v1.0.0
    spec:
      serviceAccountName: auxiliary-service-sa
      containers:
      - name: auxiliary-service
        image: your-ecr-repo/auxiliary-service:1.0.0
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: AWS_REGION
          value: "us-west-2"
        - name: PROJECT_NAME
          value: "myproject"
        - name: SERVICE_VERSION
          value: "1.0.0"
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
```

### Service Manifest

```yaml
apiVersion: v1
kind: Service
metadata:
  name: auxiliary-service
  namespace: production
  labels:
    app: auxiliary-service
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: auxiliary-service
```

### ServiceAccount and RBAC

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: auxiliary-service-sa
  namespace: production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/auxiliary-service-role
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: auxiliary-service-role
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: auxiliary-service-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: auxiliary-service-sa
  namespace: production
roleRef:
  kind: Role
  name: auxiliary-service-role
  apiGroup: rbac.authorization.k8s.io
```

## AWS IAM Permissions

### Required IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": [
        "arn:aws:ssm:*:*:parameter/myproject/*"
      ]
    }
  ]
}
```

### Minimal IAM Policy (Least Privilege)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParametersByPath"
      ],
      "Resource": [
        "arn:aws:ssm:us-west-2:123456789012:parameter/myproject/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter"
      ],
      "Resource": [
        "arn:aws:ssm:us-west-2:123456789012:parameter/myproject/*"
      ]
    }
  ]
}
```

## Docker Build and Deployment

### Build Commands

```bash
# Build the Docker image
docker build -t auxiliary-service:1.0.0 .

# Build with specific target
docker build --target production -t auxiliary-service:1.0.0 .

# Build with build arguments
docker build --build-arg NODE_ENV=production -t auxiliary-service:1.0.0 .
```

### Run Commands

```bash
# Run locally with environment file
docker run -p 3000:3000 --env-file .env auxiliary-service:1.0.0

# Run with individual environment variables
docker run -p 3000:3000 \
  -e AWS_REGION=us-west-2 \
  -e PROJECT_NAME=myproject \
  -e SERVICE_VERSION=1.0.0 \
  auxiliary-service:1.0.0

# Run in background
docker run -d -p 3000:3000 --env-file .env auxiliary-service:1.0.0
```

### ECR Deployment

```bash
# Login to ECR
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com

# Tag for ECR
docker tag auxiliary-service:1.0.0 \
  123456789012.dkr.ecr.us-west-2.amazonaws.com/myproject/auxiliary-service:1.0.0

# Push to ECR
docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/myproject/auxiliary-service:1.0.0
```

## Development Setup

### Local Development

```bash
# Clone repository
git clone https://github.com/your-org/auxiliary-service.git
cd auxiliary-service

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Start development server
npm run dev
```

### Environment File (.env.example)

```bash
# AWS Configuration
AWS_REGION=us-west-2
PROJECT_NAME=myproject

# Service Configuration
SERVICE_VERSION=1.0.0
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# AWS Credentials (for local development only)
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- s3Handler.test.js
```

## Monitoring and Logging

### Application Metrics

```javascript
// Example metrics collection
const metrics = {
  s3_requests_total: 0,
  ssm_requests_total: 0,
  errors_total: 0,
  response_time_ms: []
};

// Middleware for metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.response_time_ms.push(duration);
    
    if (req.path.includes('/s3/')) {
      metrics.s3_requests_total++;
    }
    if (req.path.includes('/parameters')) {
      metrics.ssm_requests_total++;
    }
    if (res.statusCode >= 400) {
      metrics.errors_total++;
    }
  });
  
  next();
});
```

### Structured Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
```

## Security Considerations

### Input Validation

```javascript
const { body, query, validationResult } = require('express-validator');

// Validate parameter name
const validateParameterName = [
  query('name')
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9/_-]+$/)
    .withMessage('Invalid parameter name format'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];
```

### Security Headers

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

## Troubleshooting

### Common Issues

1. **AWS Credentials Not Found**

   ```bash
   # Check if running in EKS with IRSA
   kubectl describe pod auxiliary-service-xxx
   
   # Verify service account annotations
   kubectl get serviceaccount auxiliary-service-sa -o yaml
   ```

2. **Parameter Not Found**

   ```bash
   # Check parameter exists in AWS
   aws ssm get-parameter --name "/myproject/database/host"
   
   # Verify IAM permissions
   aws sts get-caller-identity
   ```

3. **Health Check Failures**

   ```bash
   # Check service logs
   kubectl logs deployment/auxiliary-service
   
   # Test health endpoint manually
   kubectl port-forward pod/auxiliary-service-xxx 3000:3000
   curl http://localhost:3000/health/ready
   ```

### Debug Commands

```bash
# Test S3 connectivity
curl http://localhost:3000/api/s3/buckets

# Test parameter retrieval
curl "http://localhost:3000/api/parameters/value?name=database/host"

# Check service health
curl http://localhost:3000/health/ready

# View application logs
docker logs auxiliary-service-container
kubectl logs -f deployment/auxiliary-service
```

## Best Practices

### Code Organization

1. **Modular Structure**: Separate handlers for different AWS services
2. **Error Handling**: Comprehensive try-catch blocks with proper error responses
3. **Logging**: Structured logging with appropriate log levels
4. **Validation**: Input validation for all user-provided data

### Security

1. **Non-root User**: Run container as non-privileged user
2. **Read-only Filesystem**: Use read-only root filesystem in containers
3. **Least Privilege**: Minimal IAM permissions for required operations
4. **Input Sanitization**: Validate and sanitize all inputs

### Performance

1. **Connection Pooling**: Reuse AWS SDK clients
2. **Caching**: Cache frequently accessed parameters
3. **Resource Limits**: Set appropriate CPU and memory limits
4. **Health Checks**: Implement proper health and readiness probes

### Deployment

1. **Multi-stage Builds**: Use multi-stage Dockerfiles for smaller images
2. **Image Scanning**: Scan images for vulnerabilities
3. **Rolling Updates**: Use rolling deployment strategy
4. **Monitoring**: Implement comprehensive monitoring and alerting

## License

This project is licensed under the MIT License - see the LICENSE file for details.
