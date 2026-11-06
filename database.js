'use strict';
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

function openDatabase(filename = process.env.DB_PATH || path.join(process.cwd(), 'hospital.sqlite')) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;`);
  if (filename !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
  // These definitions preserve the tables and account hashes made during the lab setup.
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'patient'
        CHECK (role IN ('patient', 'admin'))
    );
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, specialization TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES users(id),
      doctor_id INTEGER NOT NULL REFERENCES doctors(id), appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Booked'
        CHECK (status IN ('Booked', 'Cancelled'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS unique_booked_slot
      ON appointments (doctor_id, appointment_date, appointment_time) WHERE status = 'Booked';
    CREATE TABLE IF NOT EXISTS doctor_slots (
      id INTEGER PRIMARY KEY, doctor_id INTEGER NOT NULL REFERENCES doctors(id),
      date TEXT NOT NULL, time TEXT NOT NULL, UNIQUE (doctor_id, date, time)
    );
  `);
  return db;
}

module.exports = { openDatabase };
if (require.main === module) { const db = openDatabase(); db.close(); console.log('Hospital database is ready.'); }
