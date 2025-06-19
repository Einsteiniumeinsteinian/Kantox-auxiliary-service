const { ListBucketsCommand, S3Client } = require("@aws-sdk/client-s3");
const { callAWSAPI } = require("../utils");

const s3Client = new S3Client({ region: process.env.AWS_REGION });

async function checkReadiness (req,res){
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

module.exports = {checkReadiness}