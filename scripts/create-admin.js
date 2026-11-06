'use strict';
const bcrypt = require('bcryptjs');
const { openDatabase } = require('../database');
async function main() {
  const name=(process.env.ADMIN_NAME || '').trim();
  const email=(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password=process.env.ADMIN_PASSWORD || '';
  if(!name || name.length>100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>200 || password.length<12 || Buffer.byteLength(password,'utf8')>72) throw new Error('Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (12 characters minimum, at most 72 UTF-8 bytes).');
  const db=openDatabase();
  try {
    if(db.prepare("SELECT 1 FROM users WHERE role='admin'").get()) throw new Error('An administrator already exists; no account was changed.');
    if(db.prepare('SELECT 1 FROM users WHERE lower(email)=?').get(email)) throw new Error('An account with this email already exists; no account was changed.');
    const hash=await bcrypt.hash(password,12);
    db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES (?,?,?,?)').run(name,email,hash,'admin');
    console.log('Administrator account created.');
  } finally { db.close(); }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
