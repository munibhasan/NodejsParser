const axios = require("axios");
async function fetchLocationData(latitude, longitude) {
  // REDIS FUNCTIONALITY TO STORE LATITUDE AND LONGITUDE HAS BEEN DISABLED.

  // let coordinatesStr = `${latitude},${longitude}`;
  // const redisCoordinates = await redisClient.get(coordinatesStr);
  // if (redisCoordinates) {
  //   return JSON.parse(redisCoordinates);
  // }
  const nominatimBaseUrl = "https://eurosofttechosm.com/nominatim/reverse.php";
  // const nominatimBaseUrl = "http://88.198.47.11/nominatim/reverse.php";
  const urlParameters = `?lat=${latitude}&lon=${longitude}&zoom=19&format=jsonv2`;

  try {
    const response = await axios.get(nominatimBaseUrl + urlParameters);

    if (response.status === 200) {
      // Expire it in 10 days: EX: 60 * 60 * 24 seconds = 1 day * 10 = 10 days.
      // redisClient.set(coordinatesStr, JSON.stringify(response.data), {
      //   EX: 60 * 60 * 24 * 10,
      // });
      if (response.data.error) {
        return null;
      }
      return response.data;
    }
    console.log("Failed to fetch location data");
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
}

exports.fetchLocationData = fetchLocationData;
