const DeviceController = require("./controller/device.controller");
const ValidationMiddleware = require("../Users/middleware/auth.validation.middleware");

exports.routesConfig = function (app) {
  app.post("/device", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.insert,
  ]);
  app.get("/device", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.list,
  ]);

  app.post("/deviceUnAllocated", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.listUnAllocated,
  ]);

  app.patch("/device", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.patchById,
  ]);

  app.post("/deletedevice", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.removeById,
  ]);

  app.post("/SingleDevice", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.SingleDevice,
  ]);

  app.post("/UpdateDeviceStatus", [
    ValidationMiddleware.validJWTNeeded,

    DeviceController.UpdateDeviceStatus,
  ]);

  app.post("/DeviceWithStatus", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.DeviceWithStatus,
  ]);

  app.post("/AlldeviceListbyId", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.DeviceByName,
  ]);

  app.post("/CurrentLocations", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.CurrentLocations,
  ]);

  // app.post("/deviceAssignList", [
  //   ValidationMiddleware.validJWTNeeded,
  //   DeviceController.deviceAssignList,
  // ]);

  app.post("/deviceListById", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.getById,
  ]);

  app.post("/ActiveDeviceWithClient", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.ActiveDeviceWithClient,
  ]);

  app.post("/deviceMaxno", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.getMaxNo,
  ]);

  app.post("/countDevicesIMEI", [
    ValidationMiddleware.validJWTNeeded,
    DeviceController.CountDevicesIMEI,
  ]);
};
