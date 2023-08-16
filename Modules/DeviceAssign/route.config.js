const DeviceAssignController = require("./controller/deviceassign.controller");
const ValidationMiddleware = require("../Users/middleware/auth.validation.middleware");

exports.routesConfig = function (app) {
  app.post("/DeviceAssign", [
    ValidationMiddleware.validJWTNeeded,
    DeviceAssignController.insert,
  ]);
  app.post("/DeviceAssignList", [
    ValidationMiddleware.validJWTNeeded,
    DeviceAssignController.list,
  ]);


  app.post("/GetDeviceAssignById", [
    ValidationMiddleware.validJWTNeeded,
    DeviceAssignController.GetDeviceAssignById,
  ]);
  app.post("/RemoveAssignMachine", [
    ValidationMiddleware.validJWTNeeded,
    DeviceAssignController.RemoveById,
  ]);
  

};
