"use strict";

// USAGE: DBPATH='myrv.db' node 'data/migrations/db_v03'
// To import data: sqlite3 myrv.db < data/import/checklistItem.sql

const sqlite3 = require("sqlite3");
const path = require('path');

let db = new sqlite3.Database(process.env.DBPATH);
db.run(`PRAGMA foreign_keys = ON `);
db.serialize(function() {

    // VERSION 3

    // Add isOnRav field to vehicle table
    db.run(`ALTER TABLE vehicle 
        ADD COLUMN isOnRav TINYINT
        DEFAULT 0 NOT NULL;`);
    
    db.run(`UPDATE vehicle SET isOnRav = 0;`);

    // Add checklistItem table
    db.run(`CREATE TABLE checklistItem (
        id INTEGER PRIMARY KEY,
        ipa TEXT,
        modelYear INTEGER,
        description TEXT,
        indent INTEGER,
        "order" INTEGER,
        isActive TINYINT,
        createdBy TEXT,
        updatedBy TEXT,
        createdAt DATE,
        updatedAt DATE
    )`)

});
db.close();

// TO ROLL BACK:  DROP COLUMN 'isOnRav' & DROP TABLE checklistItem;
// PRAGMA foreign_keys=off;
// BEGIN TRANSACTION;
// CREATE TABLE IF NOT EXISTS vehicle_temp(
//     id INTEGER PRIMARY KEY,
//     ipa TEXT,
//     buildNo INTEGER,
//     vin TEXT,
//     engineNo TEXT,
//     modelDesc TEXT,
//     addSpec TEXT,
//     variantCode TEXT,
//     createdBy TEXT,
//     updatedBy TEXT,
//     createdAt DATE,
//     updatedAt DATE);
// CREATE UNIQUE INDEX idxVin ON vehicle (vin);
// CREATE UNIQUE INDEX idxBuildNo ON vehicle (buildNo);
// INSERT INTO vehicle_temp SELECT id, ipa, buildNo, vin, engineNo, modelDesc, addSpec, variantCode, createdBy, updatedBy, createdAt, updatedAt FROM vehicle;
// DROP TABLE vehicle;
// ALTER TABLE vehicle_temp RENAME TO vehicle;
// COMMIT;
// PRAGMA foreign_keys=on;
// DROP TABLE checklistItem;
// VACUUM;