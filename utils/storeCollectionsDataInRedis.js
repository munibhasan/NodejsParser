async function storeCollectionsDataInRedis(mongoClient, redisClient) {
  try {
    const devicesCollection = mongoClient.db().collection("devices");
    const deviceList = await devicesCollection.find({}).toArray();
    await redisClient.set("deviceList", JSON.stringify(deviceList));

    const devicesAssignCollection = mongoClient
      .db()
      .collection("deviceassigns");
    const deviceAssignList = await devicesCollection.find({}).toArray();
    await redisClient.set("deviceAssignList", JSON.stringify(deviceList));

    const clientsCollection = mongoClient.db().collection("clients");
    const clientList = await clientsCollection.find({}).toArray();
    await redisClient.set("clientList", JSON.stringify(clientList));

    const eventtypesCollection = mongoClient.db().collection("eventtypes");
    const eventTypeList = await eventtypesCollection.find({}).toArray();
    await redisClient.set("eventTypeList", JSON.stringify(eventTypeList));

    const ruletypesCollection = mongoClient.db().collection("ruletypes");
    const ruleTypeList = await ruletypesCollection.find({}).toArray();
    await redisClient.set("ruleTypeList", JSON.stringify(ruleTypeList));

    const zonerulesCollection = mongoClient.db().collection("zonerules");
    const zoneRulesList = await zonerulesCollection.find({}).toArray();
    await redisClient.set("zoneRulesList", JSON.stringify(zoneRulesList));

    const alertexceptionsCollection = mongoClient
      .db()
      .collection("alertexceptions");
    const alertExceptionsList = await alertexceptionsCollection
      .find({})
      .toArray();
    await redisClient.set(
      "alertExceptionsList",
      JSON.stringify(alertExceptionsList)
    );

    const clientalertexceptionsCollection = mongoClient
      .db()
      .collection("clientalertexceptions");
    const clientAlertExceptionsList = await clientalertexceptionsCollection
      .find({})
      .toArray();
    await redisClient.set(
      "clientAlertExceptionsList",
      JSON.stringify(clientAlertExceptionsList)
    );

    const zonesCollection = mongoClient.db().collection("zones");
    const zonesList = await zonesCollection.find({}).toArray();
    await redisClient.set("zonesList", JSON.stringify(zonesList));

    const zonevehiclesCollection = mongoClient.db().collection("zonevehicles");
    const zoneVehiclesList = await zonevehiclesCollection.find({}).toArray();
    await redisClient.set("zoneVehiclesList", JSON.stringify(zoneVehiclesList));

    const vehiclesCollection = mongoClient.db().collection("vehicles");
    const vehiclesList = await vehiclesCollection.find({}).toArray();
    await redisClient.set("vehiclesList", JSON.stringify(vehiclesList));

    const notificationtextsCollection = mongoClient
      .db()
      .collection("notificationtexts");
    const notificationTextsList = await notificationtextsCollection
      .find({})
      .toArray();
    await redisClient.set(
      "notificationTextsList",
      JSON.stringify(notificationTextsList)
    );

    const notificationtypesCollection = mongoClient
      .db()
      .collection("notificationtypes");
    const notificationTypesList = await notificationtypesCollection
      .find({})
      .toArray();
    await redisClient.set(
      "notificationTypesList",
      JSON.stringify(notificationTypesList)
    );

    const eventsCollection = mongoClient.db().collection("events");
    const eventsList = await eventsCollection.find({}).toArray();
    await redisClient.set("eventsList", JSON.stringify(eventsList));

    const currentLocationsCollection = mongoClient
      .db()
      .collection("CurrentLocations");
    const currentLocationsList = await currentLocationsCollection
      .find({})
      .toArray();
    await redisClient.set(
      "currentLocationsList",
      JSON.stringify(currentLocationsList)
    );

    const emailsettingsCollection = mongoClient
      .db()
      .collection("emailsettings");
    const emailSettingsList = await emailsettingsCollection.find({}).toArray();
    await redisClient.set(
      "emailSettingsList",
      JSON.stringify(emailSettingsList)
    );

    const smssettingsCollection = mongoClient.db().collection("smssettings");
    const smsSettingsList = await smssettingsCollection.find({}).toArray();
    await redisClient.set("smsSettingsList", JSON.stringify(smsSettingsList));

    const usersCollection = mongoClient.db().collection("users");
    const usersList = await usersCollection.find({}).toArray();
    await redisClient.set("usersList", JSON.stringify(usersList));

    const smssentsCollection = mongoClient.db().collection("smssents");
    const smsSentsList = await smssentsCollection.find({}).toArray();
    await redisClient.set("smsSentsList", JSON.stringify(smsSentsList));

    const worldtimezonesCollection = mongoClient
      .db()
      .collection("worldtimezones");
    const worldTimezonesList = await worldtimezonesCollection
      .find({})
      .toArray();
    await redisClient.set(
      "worldTimezonesList",
      JSON.stringify(worldTimezonesList)
    );

    const smstemplatesCollection = mongoClient.db().collection("smstemplates");
    const smsTemplatesList = await smstemplatesCollection.find({}).toArray();
    await redisClient.set("smsTemplatesList", JSON.stringify(smsTemplatesList));

    const emailtemplatesCollection = mongoClient
      .db()
      .collection("emailtemplates");
    const emailTemplatesList = await emailtemplatesCollection
      .find({})
      .toArray();
    await redisClient.set(
      "emailTemplatesList",
      JSON.stringify(emailTemplatesList)
    );

    const gprscommandsCollection = mongoClient.db().collection("gprscommands");
    const gprsCommandsList = await gprscommandsCollection.find({}).toArray();
    await redisClient.set("gprsCommandsList", JSON.stringify(gprsCommandsList));

    const loginextendsCollection = mongoClient.db().collection("loginextends");
    const loginExtendsList = await loginextendsCollection.find({}).toArray();
    await redisClient.set("loginExtendsList", JSON.stringify(loginExtendsList));

    const pushnotificationhistoriesCollection = mongoClient
      .db()
      .collection("pushnotificationhistories");
    const pushNotificationHistoriesList =
      await pushnotificationhistoriesCollection.find({}).toArray();
    await redisClient.set(
      "pushNotificationHistoriesList",
      JSON.stringify(pushNotificationHistoriesList)
    );

    const rejecteddevicesCollection = mongoClient
      .db()
      .collection("rejecteddevices");
    const rejectedDevicesList = await rejecteddevicesCollection
      .find({})
      .toArray();
    await redisClient.set(
      "rejectedDevicesList",
      JSON.stringify(rejectedDevicesList)
    );
  } catch (err) {
    console.error("Error fetching documents:", err);
  }
}

module.exports = storeCollectionsDataInRedis;
