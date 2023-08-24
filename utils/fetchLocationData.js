async function fetchLocationData(latitude, longitude) {
  // REDIS FUNCTIONALITY TO STORE LATITUDE AND LONGITUDE HAS BEEN DISABLED.

  // let coordinatesStr = `${latitude},${longitude}`;
  // const redisCoordinates = await redisClient.get(coordinatesStr);
  // if (redisCoordinates) {
  //   return JSON.parse(redisCoordinates);
  // }
  const nominatimBaseUrl = "https://nominatim.openstreetmap.org/reverse";
  const urlParameters = `?lat=${latitude}&lon=${longitude}&zoom=19&format=jsonv2&accept-language=en`;

  try {
    const response = await axios.get(nominatimBaseUrl + urlParameters);
    if (response.status === 200) {
      // Expire it in 10 days: EX: 60 * 60 * 24 seconds = 1 day * 10 = 10 days.
      // redisClient.set(coordinatesStr, JSON.stringify(response.data), {
      //   EX: 60 * 60 * 24 * 10,
      // });
      return response.data;
    }
    throw new Error("Failed to fetch location data");
  } catch (error) {
    return null;
  }
}

export default fetchLocationData;
