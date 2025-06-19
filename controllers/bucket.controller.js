const { ListBucketsCommand, S3Client } = require("@aws-sdk/client-s3");
const { callAWSAPI } = require("../utils");

const s3Client = new S3Client({ region: process.env.AWS_REGION});

async function listBucket(req,res){
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

module.exports = { listBucket }