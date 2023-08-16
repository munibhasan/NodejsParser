const ClientController = require("./controller/clients.controller");
const ValidationMiddleware = require("../Users/middleware/auth.validation.middleware");

exports.routesConfig = function (app) {
  app.post("/clients", [
    ValidationMiddleware.validJWTNeeded,
    ClientController.insert,
  ]);
  
  app.post("/Allclients", [
    ValidationMiddleware.validJWTNeeded,
    ClientController.list,
  ]);
  
  app.post("/GetDeliverySettingById", [
    ValidationMiddleware.validJWTNeeded,
    ClientController.GetDeliverySettingById,
  ]); 

  app.post("/GetClientById", [
    ValidationMiddleware.validJWTNeeded,
    ClientController.GetClientById,
  ]);
  app.post("/RemoveClient", [
    ValidationMiddleware.validJWTNeeded,
    ClientController.RemoveClient,
  ]);
  
  app.post("/AllclientsListbyId", [
    ValidationMiddleware.validJWTNeeded,
    ClientController.ListbyId,
  ]); 

  app.post("/AdddeliverySetting", [
    ValidationMiddleware.validJWTNeeded,
    ClientController.insertdeliverySetting,
  ]); 

  app.post("/UpdateDeliverySetting", [
    ValidationMiddleware.validJWTNeeded,
    ClientController.UpdateDeliverySetting,
  ]); 

  app.post("/AllclientsCount", [
    ValidationMiddleware.validJWTNeeded,
    ClientController.clientlist,
  ]);

  app.post("/v2/CheckDriverProfile", [
    ValidationMiddleware.validJWTNeeded,
    ClientController.CheckDriverProfile,
  ]); 
};
