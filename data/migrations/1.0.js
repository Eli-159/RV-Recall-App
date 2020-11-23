"use strict";
const sqlite3 = require("sqlite3");

const path = require('path');

module.exports = {
    up: () => {
        return new Promise(function(resolve, reject) {
            let db = new sqlite3.Database('../myrv-recall.db');
            db.run(`PRAGMA foreign_keys = ON `);
            db.serialize(function() {

                // Create Vehicle Table
                db.run(`CREATE TABLE vehicle (
                    id INTEGER PRIMARY KEY,
                    buildNo INTEGER,
                    vin TEXT,
                    modelDesc TEXT,
                    addSpec TEXT,
                    createdBy TEXT,
                    updatedBy TEXT,
                    createdAt DATE,
                    updatedAt DATE
                )`);

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
                    createdBy TEXT,
                    updatedBy TEXT,
                    createdAt DATE,
                    updatedAt DATE,
                    FOREIGN KEY(vehicleId) REFERENCES vehicle(vehicleId)
                )`);

                // Create Workshop Table
                db.run(`CREATE TABLE workshop (
                    id INTEGER PRIMARY KEY,
                    name TEXT,
                    code TEXT,
                    createdBy TEXT,
                    updatedBy TEXT,
                    createdAt DATE,
                    updatedAt DATE    
                )`);

                // Create RecallItem Table
                db.run(`CREATE TABLE recallItem (
                    id INTEGER PRIMARY KEY,
                    description TEXT,
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
                    createdBy TEXT,
                    updatedBy TEXT,
                    createdAt DATE,
                    updatedAt DATE,
                    FOREIGN KEY(recallItemId) REFERENCES recallItem(id),
                    FOREIGN KEY(vehicleId) REFERENCES vehicle(id)
                )`);

            });
            db.close()
        })
    },

    down: () => {
        let db = new sqlite3.Database('../myrv-recall.db');
        db.serialize(function() {
            db.run(`DROP TABLE vehicleRecallItem`);
            db.run(`DROP TABLE recallItem`);
            db.run(`DROP TABLE workshop`);
            db.run(`DROP TABLE owner`);
            db.run(`DROP TABLE vehicle`);
        });
        db.close();
    }
}
