const redis = require("redis");

module.exports = async function redisConnectionHelper() {
  const REDIS_URL =
    process.env.DEV_ENV == "true"
      ? process.env.REDIS_SERVER_URL_DEV
      : process.env.REDIS_SERVER_URL_PROD;
  console.log("REDIS URL", REDIS_URL);

  const redisClient = redis.createClient({
    url: REDIS_URL,
  });
  redisClient.on("error", (error) => console.log(`Redis Error : ${error}`));
  redisClient.on("ready", () => {
    console.log("Redis has been connected!");
  });
  await redisClient.connect();
  return redisClient;
};
