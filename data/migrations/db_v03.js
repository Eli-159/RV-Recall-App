"use strict";

// USAGE: DBPATH='myrv.db' node 'data/migrations/db_v01'
// To import data: sqlite3 myrv.db < data/migrations/_import-all.sql

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
