const redis = require("redis");

module.exports = async function redisConnectionHelper() {
  const redisClient = redis.createClient({
    url: process.env.REDIS_SERVER_URL,
  });
  redisClient.on("error", (error) => console.error(`Error : ${error}`));
  await redisClient.connect();
  return redisClient;
};
