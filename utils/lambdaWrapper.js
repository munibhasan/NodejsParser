const AWS = require("aws-sdk");

const lambda = new AWS.Lambda({
  region: "eu-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  accessSecretKey: process.env.AWS_SECRET_KEY,
});

function invokeLambdaAWS(FunctionName, Payload) {
  const params = {
    FunctionName: FunctionName,
    Payload: Payload,
  };

  return new Promise((resolve, reject) => {
    lambda.invoke(params, (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports = {
  invokeLambdaAWS: invokeLambdaAWS,
};
