"use strict";

// USAGE: DBPATH='myrv.db' node 'data/migrations/db_v04'
// To import data: sqlite3 myrv.db < data/import/checklistItem.sql

const sqlite3 = require("sqlite3");
const path = require('path');

let db = new sqlite3.Database(process.env.DBPATH);

db.serialize(function() {

    // VERSION 4 - vehicle.buildNo to be TEXT not NUM
    db.run(`PRAGMA foreign_keys = off `);
    db.run(`CREATE TABLE tmpVehicle AS SELECT * FROM vehicle;`);
    db.run(`DROP TABLE vehicle`);    
    db.run(`CREATE TABLE vehicle (
        id INTEGER PRIMARY KEY,
        ipa TEXT,
        buildNo TEXT,
        vin TEXT,
        engineNo TEXT,
        modelDesc TEXT,
        addSpec TEXT,
        variantCode TEXT,
        createdBy TEXT,
        updatedBy TEXT,
        createdAt DATE,
        updatedAt DATE,
        isOnRav TINYINT
          DEFAULT 0 NOT NULL);
        CREATE UNIQUE INDEX idxVin ON vehicle (vin);
        CREATE UNIQUE INDEX idxBuildNo ON vehicle (buildNo);`);
    db.run(`INSERT INTO vehicle (id, ipa, buildNo, vin, engineNo, modelDesc, addSpec, variantCode, createdBy, updatedBy, createdAt, updatedAt, isOnRav) 
            SELECT id, ipa, buildNo, vin, engineNo, modelDesc, addSpec, variantCode, createdBy, updatedBy, createdAt, updatedAt, isOnRav from tmpVehicle;`);
    db.run(`DROP TABLE tmpVehicle;`);
    db.run(`PRAGMA foreign_keys = on; `);

});
db.close();

