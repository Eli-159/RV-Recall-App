-- Set environment
.mode csv
.headers on

-- Report of all vehicle recall items updated in last 7 days
.output data/reports/temp/recallReport.csv
SELECT v.id, 'v.ipa' AS `IPA`, v.buildNo, v.vin,
  rI.description, vRI.status, vRI.updatedBy, vRI.updatedAt, vRI.id
FROM vehicle AS `v` 
  INNER JOIN vehicleRecallItem AS `vRI` ON v.id = vRI.vehicleId
  INNER JOIN recallItem AS `rI` ON vrI.recallItemId = rI.id
WHERE vrI.updatedAt BETWEEN date('now', '-7 days') AND datetime('now');

-- Report of all owner details updated in the last 7 days
.output data/reports/temp/ownerReport.csv
SELECT v.buildNo, v.vin, o.name, o.email, o.phone, o.street, o.suburb, o.state, o.postcode, o.updatedBy, o.updatedAt
FROM owner AS `o`
  INNER JOIN vehicle AS `v` ON o.vehicleId = v.id
WHERE o.updatedAt BETWEEN date('now', '-7 days') AND datetime('now');

-- Report of all contact records updated in the last 7 days
.output data/reports/temp/contactReport.csv
SELECT v.vin, v.buildNo, rC.action, rC.response, rF.name, rF.tag, rF.feedback, rC.updatedBy, rC.updatedAt
FROM recallContact as `rC`
  INNER JOIN vehicle AS `v` ON rC.vehicleId = v.id
  LEFT JOIN recallFeedback AS `rF` ON rC.id = rF.recallContactId
WHERE rC.updatedAt BETWEEN date('now', '-7 days') AND datetime('now');

-- NTI Report - all Owner or Vehicle records updated in the last 7 days
.output data/reports/temp/NtiReport.csv
SELECT v.id, v.ipa, v.buildNo, v.vin, v.engineNo, v.modelDesc, v.addSpec, v.variantCode, o.id, o.vehicleId, o.name, o.email, o.phone, o.street, o.suburb, o.state, o.postcode, o.regoState, o.regoNo, o.regoDt, v.updatedBy, v.updatedAt, o.updatedBy, o.updatedAt
FROM vehicle AS `v` 
  LEFT JOIN (
    SELECT id, vehicleId, name, email, phone, street, suburb, state, postcode, regoState, regoNo, regoDt, createdBy, updatedBy, createdAt, updatedAt 
    FROM owner
    GROUP BY vehicleId 
    HAVING ROWID = MAX(ROWID) 
    ORDER BY id
  ) AS `o` ON v.id = o.vehicleId
  WHERE 
    v.updatedAt BETWEEN date('now', '-7 days') AND datetime('now')
    OR o.updatedAt BETWEEN date('now', '-7 days') AND datetime('now');