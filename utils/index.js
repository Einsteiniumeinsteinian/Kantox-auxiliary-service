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

module.exports = {callAWSAPI}