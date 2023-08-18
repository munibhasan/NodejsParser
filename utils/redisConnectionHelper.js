const redis = require("redis");

module.exports = async function redisConnectionHelper() {
  const redisClient = redis.createClient({
    url: process.env.REDIS_SERVER_URL,
  });
  redisClient.on("error", (error) => console.log(`Redis Error : ${error}`));
  redisClient.on("ready", () => {
    console.log("Redis has been connected!");
  });
  await redisClient.connect();
  return redisClient;
};
