-- Set environment
.mode csv
.headers on

.mode csv
.headers on

.output data/reports/temp/accessLog.csv
SELECT * FROM accessLog;

.output data/reports/temp/recallContact.csv
SELECT * FROM recallContact;

.output data/reports/temp/recallItem.csv
SELECT * FROM recallItem;

.output data/reports/temp/vehicleRecallItem.csv
SELECT * FROM vehicleRecallItem;

.output data/reports/temp/owner.csv
SELECT * FROM owner;

.output data/reports/temp/recallFeedback.csv;
SELECT * FROM recallFeedback;

.output data/reports/temp/vehicle.csv
SELECT * FROM vehicle;