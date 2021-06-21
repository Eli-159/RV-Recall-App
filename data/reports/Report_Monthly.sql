-- Set environment
.mode csv
.headers on

-- Report of all vehicle recall items updated this month
.output data/reports/temp/recallUpdates_Monthly.csv
SELECT v.id, v.ipa, v.buildNo, v.vin,
  rI.description, vRI.status, vRI.updatedBy, vRI.updatedAt, vRI.id
FROM vehicle AS `v` 
  INNER JOIN vehicleRecallItem AS `vRI` ON v.id = vRI.vehicleId
  INNER JOIN recallItem AS `rI` ON vrI.recallItemId = rI.id
WHERE vrI.updatedAt BETWEEN date('now', 'start of month', '-1 months') AND date('now', 'start of month');

-- Report of all owner details updated this month
.output data/reports/temp/ownerUpdates_Monthly.csv
SELECT v.buildNo, v.vin, o.name, o.email, o.phone, o.street, o.suburb, o.state, o.postcode, o.updatedBy, o.updatedAt
FROM owner AS `o`
  INNER JOIN vehicle AS `v` ON o.vehicleId = v.id
WHERE o.updatedAt BETWEEN date('now', 'start of month', '-1 months') AND date('now', 'start of month');

-- Report of all contact records updated this month
.output data/reports/temp/contactUpdates_Monthly.csv
SELECT v.vin, v.buildNo, rC.action, rC.response, rF.name, rF.tag, rF.feedback, rC.updatedBy, rC.updatedAt
FROM recallContact as `rC`
  INNER JOIN vehicle AS `v` ON rC.vehicleId = v.id
  LEFT JOIN recallFeedback AS `rF` ON rC.id = rF.recallContactId
WHERE rC.updatedAt BETWEEN date('now', 'start of month', '-1 months') AND date('now', 'start of month');

-- Recall Items Status Report
.output data/reports/temp/MonthlyReporting_RecallStatus.csv
SELECT v.id, v.ipa, v.buildNo, v.vin,
  rI.description, vRI.status, vRI.updatedBy, vRI.updatedAt, vRI.id
FROM vehicle AS `v` 
  INNER JOIN vehicleRecallItem AS `vRI` ON v.id = vRI.vehicleId
  INNER JOIN recallItem AS `rI` ON vrI.recallItemId = rI.id;

-- Recall Owner Contact Status Report
.output data/reports/temp/MonthlyReporting_OwnerStatus.csv
SELECT v.vin, v.buildNo, q_O.name AS `owner`, q_rC.action, q_rC.response, q_rC.updatedBy, q_rC.updatedAt
FROM vehicle as `v`
  INNER JOIN (SELECT vehicleId FROM vehicleRecallItem GROUP BY vehicleId) AS `q_vRI` ON v.id = q_vRI.vehicleId
  LEFT JOIN (SELECT vehicleId, name FROM owner GROUP BY vehicleId HAVING id = MAX(id)) AS `q_O` ON v.id = q_O.vehicleId
  LEFT JOIN (SELECT vehicleId, response, action, updatedBy, updatedAt FROM recallContact WHERE response IS NOT NULL GROUP BY vehicleId HAVING id = MAX(id)) AS `q_rC` ON v.id = q_rC.vehicleId;

-- Current Owners Report
.output data/reports/temp/MonthlyReporting_CurrentOwners.csv
SELECT v.buildNo, v.vin, o.id, o.vehicleId, o.name, o.email, o.phone, o.street, o.suburb, o.state, o.postcode, o.regoState, o.regoNo, o.regoDt, o.createdAt AS ownerCreatedAt, o.createdBy AS ownerCreatedBy, o.updatedBy AS ownerUpdatedBy, o.updatedAt AS ownerUpdatedAt
FROM vehicle AS `v` 
  INNER JOIN (
    SELECT id, vehicleId, name, email, phone, street, suburb, state, postcode, regoState, regoNo, regoDt, createdBy, updatedBy, createdAt, updatedAt 
    FROM owner
    GROUP BY vehicleId 
    HAVING ROWID = MAX(ROWID) 
    ORDER BY id
  ) AS `o` ON v.id = o.vehicleId;

-- NTI Report - all Owner or Vehicle records updated in the last 7 days
.output data/reports/temp/NtiReport.csv
SELECT v.id, v.ipa, v.buildNo, v.vin, v.engineNo, v.modelDesc, v.addSpec, v.variantCode, o.id, o.vehicleId, o.name, o.email, o.phone, o.street, o.suburb, o.state, o.postcode, o.regoState, o.regoNo, o.regoDt, v.updatedBy AS vehicleUpdatedBy, v.updatedAt AS vehicleUpdatedAt, o.updatedBy AS ownerUpdatedBy, o.updatedAt AS ownerUpdatedAt
FROM vehicle AS `v` 
  LEFT JOIN (
    SELECT id, vehicleId, name, email, phone, street, suburb, state, postcode, regoState, regoNo, regoDt, createdBy, updatedBy, createdAt, updatedAt 
    FROM owner
    GROUP BY vehicleId 
    HAVING ROWID = MAX(ROWID) 
    ORDER BY id
  ) AS `o` ON v.id = o.vehicleId
  WHERE 
    v.updatedAt BETWEEN date('now', 'start of month', '-1 months') AND date('now', 'start of month')
    OR o.updatedAt BETWEEN date('now', 'start of month', '-1 months') AND date('now', 'start of month');