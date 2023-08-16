const collections = [
  "deviceList",
  "deviceAssignList",
  "clientList",
  "eventTypeList",
  "ruleTypeList",
  "zoneRulesList",
  "alertExceptionsList",
  "clientAlertExceptionsList",
  "zonesList",
  "zoneVehiclesList",
  "vehiclesList",
  "notificationTextsList",
  "notificationTypesList",
  "eventsList",
  "currentLocationsList",
  "emailSettingsList",
  "smsSettingsList",
  "usersList",
  "smsSentsList",
  "worldTimezonesList",
  "smsTemplatesList",
  "emailTemplatesList",
  "gprsCommandsList",
  "loginExtendsList",
  "pushNotificationHistoriesList",
  "rejectedDevicesList",
];

async function getAllCollectionDataFromRedis(redisClient) {
  try {
    const result = {};

    for (const collectionName of collections) {
      const value = await redisClient.get(collectionName);

      if (value) {
        result[`${collectionName}`] = value;
      } else {
        console.log(`Value for ${collectionName} is not set in Redis.`);
      }
    }

    return result;
  } catch (error) {
    console.error("Error checking Redis values:", error);
    throw error;
  }
}

module.exports = getAllCollectionDataFromRedis;
