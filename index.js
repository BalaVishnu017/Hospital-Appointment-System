'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const { openDatabase } = require('./database');

function fail(message, status = 400) { const e = new Error(message); e.status = status; throw e; }
function text(value, label, max = 100) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(`${label} is required and must be at most ${max} characters.`);
  return value.trim();
}
function positiveId(value) { const n = Number(value); if (!Number.isSafeInteger(n) || n < 1) fail('Invalid ID.'); return n; }
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.slice(0,4) < '1900' || Number.isNaN(Date.parse(value+'T00:00:00Z')) || new Date(value+'T00:00:00Z').toISOString().slice(0,10) !== value) fail('Enter a valid date.');
  return value;
}
function validTime(value) { if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) fail('Enter a valid time.'); return value; }
function indiaNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
  const o=Object.fromEntries(parts.map(p=>[p.type,p.value])); return { date:`${o.year}-${o.month}-${o.day}`, time:`${o.hour}:${o.minute}` };
}
function future(date,time) { const now=indiaNow(); return date>now.date || (date===now.date && time>now.time); }
function createApp(db) {
  const app=express(), dummyHash=bcrypt.hashSync(crypto.randomBytes(16).toString('hex'),10), attempts=new Map();
  app.disable('x-powered-by');
  app.use(express.json({limit:'8kb'}));
  app.use((req,res,next)=>{
    res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    if(req.path.startsWith('/api/')) res.setHeader('Cache-Control','no-store'); next();
  });
  app.use(session({
    secret:process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave:false,saveUninitialized:false,
    cookie:{httpOnly:true,sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',maxAge:8*60*60*1000}
  }));
  app.use('/api',(req,res,next)=>{
    if (!req.session.csrfToken) req.session.csrfToken=crypto.randomBytes(32).toString('hex');
    if (['POST','PUT','PATCH','DELETE'].includes(req.method) && req.get('X-CSRF-Token')!==req.session.csrfToken) return res.status(403).json({message:'Session expired. Refresh the page and try again.'});
    next();
  });
  function auth(req,res,next) { if(!req.session.user) return res.status(401).json({message:'Please sign in.'}); next(); }
  function admin(req,res,next) { if(req.session.user.role!=='admin') return res.status(403).json({message:'Administrator access required.'}); next(); }
  function patient(req,res,next) { if(req.session.user.role!=='patient') return res.status(403).json({message:'Patient access required.'}); next(); }
  app.get('/health',(req,res)=>res.json({ok:true}));
  app.get('/api/session',(req,res)=>res.json({user:req.session.user || null,csrfToken:req.session.csrfToken}));
  app.post('/api/register',async(req,res)=>{
    const name=text(req.body.name,'Name'),email=text(req.body.email,'Email',200).toLowerCase(),password=req.body.password;
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid email address.');
    if(typeof password!=='string'||password.length<8||Buffer.byteLength(password,'utf8')>72) fail('Password must be at least 8 characters and at most 72 bytes.');
    if(db.prepare('SELECT 1 FROM users WHERE lower(email)=?').get(email)) fail('An account with this email already exists.',409);
    const hash=await bcrypt.hash(password,12);
    db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES (?,?,?,?)').run(name,email,hash,'patient');
    res.status(201).json({message:'Registration successful. Please sign in.'});
  });
  app.post('/api/login',async(req,res,next)=>{
    try {
      const email=typeof req.body.email==='string'?req.body.email.trim().toLowerCase():'';
      const password=typeof req.body.password==='string' && Buffer.byteLength(req.body.password,'utf8')<=72 ? req.body.password : '';
      const key=`${req.ip}|${email}`, now=Date.now(), attempt=attempts.get(key);
      if(attempt && now-attempt.started<15*60*1000 && attempt.count>=10) return res.status(429).json({message:'Too many attempts. Please try again later.'});
      const user=db.prepare('SELECT id,name,email,password_hash,role FROM users WHERE lower(email)=?').get(email);
      const valid=await bcrypt.compare(password,user?.password_hash || dummyHash);
      if(!user||!valid) { const a=attempt && now-attempt.started<15*60*1000?attempt:{started:now,count:0}; a.count++; attempts.set(key,a); return res.status(401).json({message:'Incorrect email or password.'}); }
      attempts.delete(key);
      req.session.regenerate(err=>{ if(err) return next(err); req.session.user={id:user.id,name:user.name,role:user.role}; req.session.csrfToken=crypto.randomBytes(32).toString('hex'); req.session.save(saveError=>{ if(saveError) return next(saveError); res.json({message:`Welcome, ${user.name}!`}); }); });
    } catch(error) { next(error); }
  });
  app.post('/api/logout',auth,(req,res,next)=>req.session.destroy(error=>{if(error)return next(error); res.clearCookie('connect.sid'); res.json({message:'Logged out successfully.'});}));
  app.get('/api/doctors',auth,(req,res)=>{
    const specialization=typeof req.query.specialization==='string'?req.query.specialization.trim():'';
    if(specialization.length>100) fail('Specialization is too long.');
    const doctors=db.prepare('SELECT id,name,specialization FROM doctors WHERE instr(lower(specialization),lower(?))>0 OR ?=\'\' ORDER BY name COLLATE NOCASE').all(specialization,specialization);
    res.json({doctors});
  });
  app.post('/api/admin/doctors',auth,admin,(req,res)=>{
    const name=text(req.body.name,'Doctor name'),specialization=text(req.body.specialization,'Specialization');
    const r=db.prepare('INSERT INTO doctors(name,specialization) VALUES (?,?)').run(name,specialization);
    res.status(201).json({id:Number(r.lastInsertRowid),message:'Doctor added.'});
  });
  app.post('/api/admin/slots',auth,admin,(req,res)=>{
    const doctorId=positiveId(req.body.doctorId), date=validDate(req.body.date),time=validTime(req.body.time);
    if(!db.prepare('SELECT 1 FROM doctors WHERE id=?').get(doctorId)) fail('Doctor not found.',404);
    if(!future(date,time)) fail('Choose a future date and time.');
    const r=db.prepare('INSERT INTO doctor_slots(doctor_id,date,time) VALUES (?,?,?)').run(doctorId,date,time);
    res.status(201).json({id:Number(r.lastInsertRowid),message:'Appointment slot added.'});
  });
  app.get('/api/admin/slots',auth,admin,(req,res)=>{
    const doctorId=req.query.doctorId?positiveId(req.query.doctorId):null;
    const rows=db.prepare(`SELECT s.id,s.doctor_id AS doctorId,d.name AS doctorName,s.date,s.time,EXISTS(SELECT 1 FROM appointments a WHERE a.doctor_id=s.doctor_id AND a.appointment_date=s.date AND a.appointment_time=s.time AND a.status='Booked') AS booked FROM doctor_slots s JOIN doctors d ON d.id=s.doctor_id WHERE (? IS NULL OR s.doctor_id=?) ORDER BY s.date,s.time`).all(doctorId,doctorId).map(r=>({...r,booked:!!r.booked}));
    res.json({slots:rows});
  });
  app.get('/api/slots',auth,(req,res)=>{
    const doctorId=positiveId(req.query.doctorId),date=req.query.date?validDate(req.query.date):null,now=indiaNow();
    if(!db.prepare('SELECT 1 FROM doctors WHERE id=?').get(doctorId)) fail('Doctor not found.',404);
    const slots=db.prepare(`SELECT s.id,s.doctor_id AS doctorId,s.date,s.time FROM doctor_slots s WHERE s.doctor_id=? AND (? IS NULL OR s.date=?) AND (s.date>? OR (s.date=? AND s.time>?)) AND NOT EXISTS(SELECT 1 FROM appointments a WHERE a.doctor_id=s.doctor_id AND a.appointment_date=s.date AND a.appointment_time=s.time AND a.status='Booked') ORDER BY s.date,s.time`).all(doctorId,date,date,now.date,now.date,now.time);
    res.json({slots});
  });
  app.post('/api/appointments',auth,patient,(req,res)=>{
    const slotId=positiveId(req.body.slotId);
    db.exec('BEGIN IMMEDIATE');
    try {
      const slot=db.prepare('SELECT doctor_id,date,time FROM doctor_slots WHERE id=?').get(slotId);
      if(!slot) fail('Appointment slot not found.',404); if(!future(slot.date,slot.time)) fail('This appointment slot has passed.');
      const result=db.prepare("INSERT INTO appointments(patient_id,doctor_id,appointment_date,appointment_time,status) VALUES (?,?,?,?, 'Booked')").run(req.session.user.id,slot.doctor_id,slot.date,slot.time);
      db.exec('COMMIT'); res.status(201).json({id:Number(result.lastInsertRowid),message:'Appointment booked.'});
    } catch(error) { db.exec('ROLLBACK'); throw error; }
  });
  app.get('/api/appointments',auth,patient,(req,res)=>{
    const appointments=db.prepare(`SELECT a.id,a.doctor_id AS doctorId,d.name AS doctorName,d.specialization,a.appointment_date AS date,a.appointment_time AS time,a.status FROM appointments a JOIN doctors d ON d.id=a.doctor_id WHERE a.patient_id=? ORDER BY a.appointment_date DESC,a.appointment_time DESC`).all(req.session.user.id);
    res.json({appointments});
  });
  app.get('/api/admin/appointments',auth,admin,(req,res)=>{
    const appointments=db.prepare(`SELECT a.id,u.name AS patientName,u.email AS patientEmail,d.name AS doctorName,d.specialization,a.appointment_date AS date,a.appointment_time AS time,a.status FROM appointments a JOIN doctors d ON d.id=a.doctor_id JOIN users u ON u.id=a.patient_id ORDER BY a.appointment_date DESC,a.appointment_time DESC`).all();
    res.json({appointments});
  });
  app.post('/api/appointments/:id/cancel',auth,(req,res)=>{
    const appointmentId=positiveId(req.params.id),a=db.prepare('SELECT patient_id,status FROM appointments WHERE id=?').get(appointmentId);
    if(!a) fail('Appointment not found.',404);
    if(req.session.user.role!=='admin' && a.patient_id!==req.session.user.id) fail('You cannot cancel this appointment.',403);
    if(a.status!=='Booked') fail('This appointment is already cancelled.',409);
    db.prepare("UPDATE appointments SET status='Cancelled' WHERE id=? AND status='Booked'").run(appointmentId);
    res.json({message:'Appointment cancelled.'});
  });
  app.use(express.static(path.join(__dirname,'public')));
  app.use((error,req,res,next)=>{
    if(res.headersSent) return next(error);
    if(error.status) return res.status(error.status).json({message:error.message});
    if(String(error.message).includes('UNIQUE constraint failed')) return res.status(409).json({message:'This email or appointment slot is already in use.'});
    console.error('Request failed:',error.message); res.status(500).json({message:'Something went wrong. Please try again.'});
  });
  return app;
}
module.exports={createApp};
if(require.main===module) {
  const db=openDatabase(),app=createApp(db),port=Number(process.env.PORT || 3001),host=process.env.HOST || '127.0.0.1';
  const server=app.listen(port,host,()=>console.log(`Hospital application listening on ${host}:${port}`));
  for(const sig of ['SIGTERM','SIGINT']) process.on(sig,()=>server.close(()=>{db.close();process.exit(0);}));
}
