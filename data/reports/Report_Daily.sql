-- Set environment
.mode csv
.headers on

-- Report of all vehicle recall items updated month to date
.output data/reports/temp/recallReport.csv
SELECT v.id, 'v.ipa' AS `IPA`, v.buildNo, v.vin,
  rI.description, vRI.status, vRI.updatedBy, vRI.updatedAt, vRI.id
FROM vehicle AS `v` 
  INNER JOIN vehicleRecallItem AS `vRI` ON v.id = vRI.vehicleId
  INNER JOIN recallItem AS `rI` ON vrI.recallItemId = rI.id
WHERE vrI.updatedAt BETWEEN date('now', 'start of month') AND datetime('now');

-- Report of all owner details updated month to date
.output data/reports/temp/ownerReport.csv
SELECT v.buildNo, v.vin, o.name, o.email, o.phone, o.street, o.suburb, o.state, o.postcode, o.updatedBy, o.updatedAt
FROM owner AS `o`
  INNER JOIN vehicle AS `v` ON o.vehicleId = v.id
WHERE o.updatedAt BETWEEN date('now', 'start of month') AND datetime('now');

-- Report of all contact records updated month to date
.output data/reports/temp/contactReport.csv
SELECT v.vin, v.buildNo, rC.action, rC.response, rF.name, rF.tag, rF.feedback, rC.updatedBy, rC.updatedAt
FROM recallContact as `rC`
  INNER JOIN vehicle AS `v` ON rC.vehicleId = v.id
  LEFT JOIN recallFeedback AS `rF` ON rC.id = rF.recallContactId
WHERE rC.updatedAt BETWEEN date('now', 'start of month') AND datetime('now');

-- NTI Report - all Owner or Vehicle records updated month to date
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
    v.updatedAt BETWEEN date('now', 'start of month') AND datetime('now')
    OR o.updatedAt BETWEEN date('now', 'start of month') AND datetime('now');

-- Recall Registration Report - Owners who have registered for the recall in the last 14 days
.output data/reports/temp/recallRegistrationReport_14Days.csv
SELECT 
  rC.id, rC.action, rC.response, rF.name, rF.tag, rF.feedback, v.vin, v.modelDesc, rC.createdAt
FROM 
  ((recallContact rC 
      INNER JOIN recallFeedback rF ON rC.id = rF.recallContactId)
    LEFT JOIN vehicle v ON rC.vehicleId = v.id)
WHERE rC.action = 'recall registration' AND rC.createdAt > date('now', '-14 days')
ORDER BY rC.createdAt DESC;