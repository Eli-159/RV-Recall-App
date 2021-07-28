"use strict";

// USAGE: DBPATH='myrv.db' node 'data/migrations/db_v01'
// To import data: sqlite3 myrv.db < data/migrations/_import-all.sql

const sqlite3 = require("sqlite3");
const path = require('path');

let db = new sqlite3.Database(process.env.DBPATH);
db.run(`PRAGMA foreign_keys = ON `);
db.serialize(function() {

    // VERSION 2

    // Add isActive field to Owner table
    db.run(`ALTER TABLE owner 
        ADD COLUMN isActive TINYINT
        DEFAULT 1 NOT NULL;`);
    
    db.run(`UPDATE owner SET isActive = 1;`);

    

});
db.close();
