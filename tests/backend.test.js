'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { openDatabase } = require('../database');
const { createApp } = require('../index');

test('existing accounts, roles, slots, booking, cancellation and persistence', async t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hospital-test-')),file=path.join(dir,'test.sqlite');
  let db=openDatabase(file),server;
  // Seed existing accounts as the previous lab schema did.
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES (?,?,?,?)').run('Admin','admin@example.test',bcrypt.hashSync('admin-password-123',10),'admin');
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES (?,?,?,?)').run('Existing patient','existing@example.test',bcrypt.hashSync('patient-password-123',10),'patient');
  db.close(); db=openDatabase(file);
  assert.equal(db.prepare('SELECT count(*) AS n FROM users').get().n,2);
  server=createApp(db).listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
  t.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));if(db)db.close();if(path.dirname(dir)===path.resolve(os.tmpdir()) && path.basename(dir).startsWith('hospital-test-'))fs.rmSync(dir,{recursive:true,force:true});});
  const base=`http://127.0.0.1:${server.address().port}`;
  function client() {
    let cookie='',csrf='';
    return async (url,method='GET',body) => {
      const response=await fetch(base+url,{method,headers:{...(cookie?{cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
      const set=response.headers.get('set-cookie');if(set)cookie=set.split(';')[0];
      const data=await response.json();if(data.csrfToken)csrf=data.csrfToken;return {status:response.status,data};
    };
  }
  const admin=client(),p1=client(),p2=client(),guest=client();
  assert.equal((await guest('/api/admin/appointments')).status,401);
  assert.equal((await guest('/api/register','POST',{name:'No CSRF',email:'no@example.test',password:'abc123456'})).status,403);
  await admin('/api/session'); assert.equal((await admin('/api/login','POST',{email:'admin@example.test',password:'admin-password-123'})).status,200); await admin('/api/session');
  await p1('/api/session'); assert.equal((await p1('/api/login','POST',{email:'existing@example.test',password:'patient-password-123'})).status,200); await p1('/api/session');
  assert.equal((await p1('/api/admin/doctors','POST',{name:'Unauthorized',specialization:'Test'})).status,403);
  const d=await admin('/api/admin/doctors','POST',{name:'Dr Example',specialization:'Cardiology'});assert.equal(d.status,201);
  assert.equal((await p1('/api/doctors?specialization=cardio')).data.doctors.length,1);
  assert.equal((await admin('/api/admin/slots','POST',{doctorId:d.data.id,date:'2000-01-01',time:'10:00'})).status,400);
  const slot=await admin('/api/admin/slots','POST',{doctorId:d.data.id,date:'2099-01-02',time:'10:30'});assert.equal(slot.status,201);
  assert.equal((await admin('/api/admin/slots','POST',{doctorId:d.data.id,date:'2099-01-02',time:'10:30'})).status,409);
  assert.equal((await p1(`/api/slots?doctorId=${d.data.id}`)).data.slots.length,1);
  const booked=await p1('/api/appointments','POST',{slotId:slot.data.id});assert.equal(booked.status,201);
  assert.equal((await p1(`/api/slots?doctorId=${d.data.id}`)).data.slots.length,0);
  await p2('/api/session');
  assert.equal((await p2('/api/register','POST',{name:'New patient',email:'new@example.test',password:'patient-password-456'})).status,201);
  assert.equal((await p2('/api/register','POST',{name:'New patient',email:'NEW@example.test',password:'patient-password-456'})).status,409);
  assert.equal((await p2('/api/login','POST',{email:'new@example.test',password:'patient-password-456'})).status,200);await p2('/api/session');
  assert.equal((await p2('/api/appointments','POST',{slotId:slot.data.id})).status,409);
  assert.equal((await p2(`/api/appointments/${booked.data.id}/cancel`,'POST',{})).status,403);
  assert.equal((await p1(`/api/appointments/${booked.data.id}/cancel`,'POST',{})).status,200);
  assert.equal((await p1(`/api/appointments/${booked.data.id}/cancel`,'POST',{})).status,409);
  assert.equal((await p1(`/api/slots?doctorId=${d.data.id}`)).data.slots.length,1);
  assert.equal((await p2('/api/appointments','POST',{slotId:slot.data.id})).status,201);
  assert.equal((await admin('/api/admin/appointments')).data.appointments.length,2);
  const db2=openDatabase(file); assert.equal(db2.prepare("SELECT count(*) AS n FROM appointments WHERE status='Booked'").get().n,1);assert.equal(db2.prepare('SELECT count(*) AS n FROM users').get().n,3);db2.close();
});
