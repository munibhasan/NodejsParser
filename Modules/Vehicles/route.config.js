const VehicleController = require("./controller/vehicle.controller");
const ValidationMiddleware = require("../Users/middleware/auth.validation.middleware");

exports.routesConfig = function (app) {
  app.post("/vehicle", [
    ValidationMiddleware.validJWTNeeded,
    VehicleController.insert,
  ]);
  app.post("/vehicleListByClientId", [
    ValidationMiddleware.validJWTNeeded,
    VehicleController.listByClientId,
  ]);

  app.post("/GetAvailableVehicles", [
    ValidationMiddleware.validJWTNeeded,
    VehicleController.GetAvailableVehicles,
  ]);
  
  app.post("/v2/GetAvailableVehiclesForDriver", [
    ValidationMiddleware.validJWTNeeded,
    VehicleController.GetAvailableVehiclesForDriver,
  ]);
  



  app.post("/vehiclestep", [
    ValidationMiddleware.validJWTNeeded,
    VehicleController.getByClientId,
  ]);

  app.post("/VehicleByVehicleId", [
    ValidationMiddleware.validJWTNeeded,
    VehicleController.VehicleByVehicleId,
  ]);


  app.post("/removeVehicle", [
    ValidationMiddleware.validJWTNeeded,
    VehicleController.removeById,
  ]);


  app.post("/UpdateVehicleStatus", [
    ValidationMiddleware.validJWTNeeded,
    VehicleController.UpdateVehicleStatus,
  ]);

  app.post("/RemoveAssignVehicle", [
    ValidationMiddleware.validJWTNeeded,
    VehicleController.RemoveAssignVehicle,
  ]);

  app.post("/vehicleDetailsWithCurrentLocationById", [
    ValidationMiddleware.validJWTNeeded,
    VehicleController.vehicleDetailsWithCurrentLocationById,
  ]);
  
  //  app.post("/vehiclelist", [
  //   ValidationMiddleware.validJWTNeeded,
  //   VehicleController.VehileList,
  // ]);
  // app.post('/login', [
  //     // VerifyUserMiddleware.hasAuthValidFields,
  //     // VerifyUserMiddleware.isPasswordAndUserMatch,
  //     // UsersController.login
  // ]);
};
