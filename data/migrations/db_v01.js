"use strict";

// USAGE: DBPATH='myrv.db' node 'data/migrations/db_v01'
// To import data: sqlite3 myrv.db < data/migrations/_import-all.sql

const sqlite3 = require("sqlite3");
const path = require('path');

let db = new sqlite3.Database(process.env.DBPATH);
db.run(`PRAGMA foreign_keys = ON `);
db.serialize(function() {

    // VERSION 1 - Create all tables & keys

    // Create Vehicle Table
    db.run(`CREATE TABLE vehicle (
        id INTEGER PRIMARY KEY,
        ipa TEXT,
        buildNo INTEGER,
        vin TEXT,
        engineNo TEXT,
        modelDesc TEXT,
        addSpec TEXT,
        variantCode TEXT,
        createdBy TEXT,
        updatedBy TEXT,
        createdAt DATE,
        updatedAt DATE
    )`);
    db.run(`CREATE UNIQUE INDEX idxVin ON vehicle (vin);`);
    db.run(`CREATE UNIQUE INDEX idxBuildNo ON vehicle (buildNo);`)

    // Create Owner Table
    db.run(`CREATE TABLE owner (
        id INTEGER PRIMARY KEY,
        vehicleId INTEGER,
        name TEXT,
        email TEXT,
        phone TEXT,
        street TEXT,
        suburb TEXT,
        state TEXT,
        postcode TEXT,
        regoState TEXT,
        regoNo TEXT,
        regoDt DATE,
        createdBy TEXT,
        updatedBy TEXT,
        createdAt DATE,
        updatedAt DATE,
        FOREIGN KEY(vehicleId) REFERENCES vehicle(id)
    )`);

    // Create Workshop Table
    db.run(`CREATE TABLE workshop (
        id INTEGER PRIMARY KEY,
        name TEXT,
        code TEXT,
        role TEXT,
        createdBy TEXT,
        updatedBy TEXT,
        createdAt DATE,
        updatedAt DATE    
    )`);

    // Create RecallItem Table
    db.run(`CREATE TABLE recallItem (
        id INTEGER PRIMARY KEY,
        description TEXT,
        workInstructionUrl TEXT,
        createdBy TEXT,
        updatedBy TEXT,
        createdAt DATE,
        updatedAt DATE
    )`);

    // Create VehicleRecallItem Table
    db.run(`CREATE TABLE vehicleRecallItem (
        id INTEGER PRIMARY KEY,
        recallItemId INTEGER,
        vehicleId INTEGER,
        status TEXT,
        createdBy TEXT,
        updatedBy TEXT,
        createdAt DATE,
        updatedAt DATE,
        FOREIGN KEY(recallItemId) REFERENCES recallItem(id),
        FOREIGN KEY(vehicleId) REFERENCES vehicle(id)
    )`);

    // Create AccessLog Table
    db.run(`CREATE TABLE accessLog (
        id INTEGER PRIMARY KEY,
        url TEXT,
        ip TEXT,
        user TEXT,
        success BOOLEAN,
        createdAt DATE,
        updatedAt DATE
    )`);

    // Create recallContact Table
    db.run( `CREATE TABLE recallContact (
        id INTEGER PRIMARY KEY,
        vehicleId INTEGER,
        action TEXT,
        response TEXT,
        createdBy TEXT,
        updatedBy TEXT,
        createdAt DATE,
        updatedAt DATE,
        FOREIGN KEY(vehicleId) REFERENCES vehicle(id)
    )`);

    // Create recallFeedback Table
    db.run( `CREATE TABLE recallFeedback (
        id INTEGER PRIMARY KEY,
        recallContactId INTEGER,
        name TEXT,
        tag TEXT,
        feedback TEXT,
        createdBy TEXT,
        updatedBy TEXT,
        createdAt DATE,
        updatedAt DATE,
        FOREIGN KEY(recallContactId) REFERENCES recallContact(id)
    )`);
});
db.close();
