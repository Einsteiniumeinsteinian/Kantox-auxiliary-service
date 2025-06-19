const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require("@aws-sdk/client-ssm");
const { callAWSAPI } = require("../utils");

const PROJECT_NAME = process.env.PROJECT_NAME
const ssmClient = new SSMClient({ region: process.env.AWS_REGION });


async function listParameters(req, res){
  try {
    const parameterPath = `/${PROJECT_NAME}/`;
    const parameters = [];
    const command = new GetParametersByPathCommand({
      Path: parameterPath,
      Recursive: true, // Set to false if you only want direct children
      WithDecryption: false, // Set to true if you need SecureString values
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
   
    console.log(`Successfully retrieved ${parameters.length} parameters`);
   
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

async function getParameterValue(req, res){
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
       
        console.log(`Successfully retrieved parameter: ${fullParameterName}`);
       
        res.json({
          success: true,
          data: parameter,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error fetching parameter ${req.params.name}:`, error);
       
        if (error.name === 'ParameterNotFound') {
          res.status(404).json({
            success: false,
            error: `Parameter '${req.params.name}' not found`,
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

module.exports = {listParameters, getParameterValue}
