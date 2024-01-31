const moment = require("moment");
const getDistanceFromLatLonInMilesUtil = require("./getDistanceFromLatLonInMiles.util");

module.exports = getTripsByAvlMongoProms = (body, avlDataProm) => {
  return new Promise(async (resolve, reject) => {
    try {
      var tripStart = false;
      var tripRecords = [];
      let rowData = await avlDataProm;
      console.log("rowDataLength ====>", rowData.length);

      //var sortedArray=[];

      for (var i = 0; i < rowData.length; i++) {
        var trip = {};
        var IoElement = rowData[i].IoElement;
        var ignitionValue = IoElement.Properties.filter((value) => {
          return value._id == 239;
        })[0];
        var eventValue = IoElement.Properties.filter((value) => {
          return value._id == 250;
        })[0];

        if (
          eventValue != undefined &&
          eventValue.Value == 1 &&
          ignitionValue.Value == 1
        ) {
          tripStart = true;
        } else if (
          eventValue != undefined &&
          eventValue.Value == 0 &&
          ignitionValue.Value == 0
        ) {
          tripStart = false;
        }

        if (tripStart == false) {
          var Trip = tripRecords.find((x) => x.Status == "Running");
          if (Trip != undefined) {
            if (Trip.Status == "Running") {
              Trip.TripEnd = rowData[i].date;
              Trip["toDateTime"] = rowData[i].date;
              Trip.TripEndDateLabel = rowData[i].date.split("T")[0];
              Trip.TripEndTimeLabel = rowData[i].date
                .split("T")[1]
                .split(".")[0];
              Trip.Status = "Complete";
              if (
                rowData[i].DriverName != undefined &&
                rowData[i].DriverName != ""
              ) {
                Trip.DriverName = rowData[i].DriverName.replace(
                  "undefined",
                  ""
                );
              }

              var admission = moment(new Date(Trip.TripStart));
              var discharge = moment(new Date(Trip.TripEnd));
              var hours = Math.floor(
                moment.duration(discharge.diff(admission)).asHours()
              );
              var mins =
                Math.floor(
                  moment.duration(discharge.diff(admission)).asMinutes()
                ) -
                hours * 60;
              Trip.TripDurationHr = hours;
              Trip.TripDurationMins = mins;
              var endingObj = rowData[i].OsmElement;
              var city;
              var postcode;
              var address1;
              var address2;
              if (
                endingObj?.address.office != undefined &&
                endingObj?.address.office != "" &&
                endingObj?.address.office != null &&
                endingObj?.address.office != undefined
              ) {
                address1 = endingObj?.address.office;
              } else if (
                endingObj?.address.neighbourhood != "" &&
                endingObj?.address.neighbourhood != null &&
                endingObj?.address.neighbourhood != undefined
              ) {
                address1 = endingObj?.address.neighbourhood;
              } else {
                address1 = "";
              }

              if (
                endingObj?.address.road != "" &&
                endingObj?.address.road != null &&
                endingObj?.address.road != undefined
              ) {
                address2 = endingObj?.address.road;
              } else if (
                endingObj?.address.suburb != "" &&
                endingObj?.address.suburb != null &&
                endingObj?.address.suburb != undefined
              ) {
                address2 = endingObj?.address.suburb;
              } else {
                address2 = "";
              }

              if (
                endingObj?.address.city != "" &&
                endingObj?.address.city != null &&
                endingObj?.address.city != undefined
              ) {
                city = endingObj?.address.city;
              } else {
                city = "";
              }
              if (
                endingObj?.address.postcode != "" &&
                endingObj?.address.postcode != null &&
                endingObj?.address.postcode != undefined
              ) {
                postcode = endingObj?.address.postcode;
              } else {
                postcode = "";
              }

              var endingPoint =
                address1 + " " + address2 + " " + city + " " + postcode;
              Trip.EndingPoint = endingPoint;
              Trip.EndingPointComplete = endingObj?.address;
              var totalDIstanceCovered = 0;
              var averageSpeed = 0;
              var totalSpeed = 0;
              var maxSpeed = 0;
              var arrayCounter = 0;
              var allCounter = 0;

              while (Trip.childRecords.length > arrayCounter) {
                totalDIstanceCovered += getDistanceFromLatLonInMiles(
                  Trip.childRecords[allCounter].Y,
                  Trip.childRecords[allCounter].X,
                  Trip.childRecords[arrayCounter].Y,
                  Trip.childRecords[arrayCounter].X,
                  req.body.unit
                );
                totalSpeed += Trip.childRecords[allCounter].Speed;
                maxSpeed = Math.max(
                  maxSpeed,
                  Trip.childRecords[allCounter].Speed
                );
                allCounter = arrayCounter;
                arrayCounter++;
              }

              averageSpeed = totalSpeed / Trip.childRecords.length;

              if (req.body.unit == "KM") {
                Trip.AverageSpeed = Math.round(averageSpeed) + " " + "Kph";
                Trip.MaxSpeed = Math.round(maxSpeed) + " " + "Kph";
              } else {
                Trip.AverageSpeed =
                  Math.round(averageSpeed / 1.609) + " " + "Mph";
                Trip.MaxSpeed = Math.round(maxSpeed / 1.609) + " " + "Mph";
              }

              Trip.TotalDistance =
                Math.round(totalDIstanceCovered * 100) / 100 +
                " " +
                req.body.unit +
                "(S)";
              Trip.childRecords = [];
            }
          }
        } else if (tripStart == true) {
          var Trip = tripRecords.find((x) => x.Status == "Running");
          if (Trip == undefined) {
            trip["period"] = req.body.period;
            trip["id"] = rowData[i]._id;
            trip["Status"] = "Running";
            trip["Vehicle"] = req.body.vehicleReg;
            trip["IMEI"] = rowData[i].deviceIMEI;
            trip["TripStart"] = rowData[i].date;
            trip["fromDateTime"] = rowData[i].date;
            trip["TripStartDateLabel"] = rowData[i].date.split("T")[0];
            trip["TripStartTimeLabel"] = rowData[i].date
              .split("T")[1]
              .split(".")[0];
            trip["TripEnd"] = null;
            trip["TripEndDateLabel"] = null;
            trip["TripEndTimeLabel"] = null;
            var startingObj = rowData[i].OsmElement;
            var address1;
            var address2;
            var city;
            var postcode;
            if (
              startingObj?.address != undefined &&
              startingObj?.address.office != "" &&
              startingObj?.address.office != null &&
              startingObj?.address.office != undefined
            ) {
              address1 = startingObj?.address.office;
            } else if (
              startingObj?.address != undefined &&
              startingObj?.address.neighbourhood != "" &&
              startingObj?.address.neighbourhood != null &&
              startingObj?.address.neighbourhood != undefined
            ) {
              address1 = startingObj?.address.neighbourhood;
            } else {
              address1 = "";
            }

            if (
              startingObj?.address != undefined &&
              startingObj?.address.road != "" &&
              startingObj?.address.road != null &&
              startingObj?.address.road != undefined
            ) {
              address2 = startingObj?.address.road;
            } else if (
              startingObj?.address != undefined &&
              startingObj?.address.suburb != "" &&
              startingObj?.address.suburb != null &&
              startingObj?.address.suburb != undefined
            ) {
              address2 = startingObj?.address.suburb;
            } else {
              address2 = "";
            }

            if (
              startingObj?.address != undefined &&
              startingObj?.address.city != "" &&
              startingObj?.address.city != null &&
              startingObj?.address.city != undefined
            ) {
              city = startingObj?.address.city;
            } else {
              city = "";
            }

            if (
              startingObj?.address != undefined &&
              startingObj?.address.postcode != "" &&
              startingObj?.address.postcode != null &&
              startingObj?.address.postcode != undefined
            ) {
              postcode = startingObj?.address.postcode;
            } else {
              postcode = "";
            }
            var startingPoint =
              address1 + " " + address2 + " " + city + " " + postcode;
            trip["TripDurationHr"] = 0;
            trip["TripDurationMins"] = 0;
            trip["TotalDistance"] = 0;
            trip["StartingPoint"] = startingPoint;
            trip["StartingPointComplete"] = startingObj?.address;
            trip["EndingPoint"] = null;
            trip["EndingPointComplete"] = null;
            trip["AverageSpeed"] = null;
            trip["MaxSpeed"] = null;

            trip["childRecords"] = [];
            if (
              rowData[i].DriverName != undefined &&
              rowData[i].DriverName != ""
            ) {
              trip["DriverName"] = rowData[i].DriverName.replace(
                "undefined",
                ""
              );
            }
            tripRecords.push(trip);
          }

          if (Trip != undefined) {
            if (
              rowData[i].DriverName != undefined &&
              rowData[i].DriverName != ""
            ) {
              Trip.DriverName = rowData[i].DriverName.replace("undefined", "");
            }
            Trip.childRecords.push(rowData[i].GpsElement);
          }
        }

        var sortedArray = [];
        if (tripRecords.length > 0) {
          for (a = 0; a < tripRecords.length; a++) {
            var obj = tripRecords[a];
            var zeroJourney;
            if (req.body.unit == "Mile") {
              zeroJourney = "0 Mile(S)";
            } else {
              zeroJourney = "0 KM(S)";
            }

            if (obj.Status != "Running" && obj.TotalDistance != zeroJourney) {
              sortedArray.push(obj);
            }
          } //end  for(a=0;a<tripRecords.length;a++)
        } //end if(tripRecords.length >0)
      } //end for loop

      const resolveData = Array.isArray(sortedArray) ? sortedArray : [];
      console.log("resolveData==>", resolveData.length);
      resolve(resolveData);
    } catch (err) {
      reject(err);
    }
  });
};
