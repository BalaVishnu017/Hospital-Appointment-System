'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const state = { user: null, csrf: '', doctors: [], selectedDoctor: null };
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
$('#slot-form').elements.date.min = today;
$('#slot-form').elements.date.value = today;

function notice(message, error = false) {
  const box = $('#message');
  box.textContent = message; box.hidden = !message; box.classList.toggle('error', error);
}
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(text, className, handler) {
  const node = element('button', text, `button ${className}`); node.type = 'button';
  node.addEventListener('click', async () => {
    node.disabled = true;
    try { await handler(); } catch (error) { notice(error.message, true); }
    finally { node.disabled = false; }
  });
  return node;
}
function empty(container, text) { container.replaceChildren(element('div', text, 'empty')); }
async function request(url, options = {}) {
  const method = options.method || 'GET';
  const response = await fetch(url, {
    method,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(!['GET', 'HEAD'].includes(method) ? { 'X-CSRF-Token': state.csrf } : {})
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('The server returned an unexpected response.'); }
  if (!response.ok) throw new Error(result.message || 'The request could not be completed.');
  return result;
}
function formHandler(selector, callback) {
  $(selector).addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget, submit = form.querySelector('button[type=submit], button:not([type])');
    if (submit) submit.disabled = true;
    try { notice(''); await callback(new FormData(form), form); } catch (error) { notice(error.message, true); }
    finally { if (submit) submit.disabled = false; }
  });
}
function authPanel(which) {
  $('#login-panel').hidden = which !== 'login'; $('#register-panel').hidden = which !== 'register';
  $('#show-login').setAttribute('aria-pressed', String(which === 'login'));
  $('#show-register').setAttribute('aria-pressed', String(which === 'register'));
  notice('');
}
$('#show-login').addEventListener('click', () => authPanel('login'));
$('#show-register').addEventListener('click', () => authPanel('register'));
function view(id) {
  document.querySelectorAll('.view').forEach(section => { section.hidden = section.id !== id; });
  document.querySelectorAll('#navigation button').forEach(item => {
    if (item.dataset.view === id) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
  });
}
$('#navigation').addEventListener('click', async event => {
  const target = event.target.closest('button[data-view]'); if (!target || target.hidden) return;
  view(target.dataset.view); notice('');
  try {
    if (target.dataset.view === 'doctors') await loadDoctors();
    if (target.dataset.view === 'appointments') await loadAppointments();
    if (target.dataset.view === 'admin') await loadAdmin();
  } catch (error) { notice(error.message, true); }
});
async function updateSession() {
  const result = await request('/api/session');
  state.user = result.user; state.csrf = result.csrfToken;
  $('#auth-view').hidden = !!state.user; $('#identity').hidden = !state.user; $('#app-view').hidden = !state.user;
  if (!state.user) { state.selectedDoctor = null; authPanel('login'); return; }
  $('#user-label').textContent = `${state.user.name} · ${state.user.role === 'admin' ? 'Admin' : 'Patient'}`;
  document.querySelectorAll('[data-admin]').forEach(node => { node.hidden = state.user.role !== 'admin'; });
  $('[data-view=appointments]').hidden = state.user.role === 'admin';
  $('#dashboard-title').textContent = state.user.role === 'admin' ? 'Manage appointments' : 'Your appointments';
  $('#dashboard-subtitle').textContent = state.user.role === 'admin' ? 'Manage doctors, availability and bookings.' : 'Find a doctor and choose a suitable time.';
  view(state.user.role === 'admin' ? 'admin' : 'doctors');
  if (state.user.role === 'admin') await loadAdmin(); else await loadDoctors();
}
formHandler('#register-form', async (data, form) => {
  const result = await request('/api/register', { method: 'POST', body: { name: data.get('name'), email: data.get('email'), password: data.get('password') } });
  const email = data.get('email'); form.reset(); authPanel('login'); $('#login-form').elements.email.value = email;
  notice(result.message || 'Account created. Please sign in.');
});
formHandler('#login-form', async (data, form) => {
  const result = await request('/api/login', { method: 'POST', body: { email: data.get('email'), password: data.get('password') } });
  form.reset(); await updateSession(); notice(result.message || 'Signed in successfully.');
});
$('#logout').addEventListener('click', async () => {
  try { await request('/api/logout', { method: 'POST' }); await updateSession(); notice('Signed out successfully.'); }
  catch (error) { notice(error.message, true); }
});
function doctorCard(doctor) {
  const card = element('div', undefined, 'card doctor-card'); const info = element('div', undefined, 'doctor-info');
  const avatar = element('span', doctor.name.trim().charAt(0).toUpperCase(), 'doctor-avatar'); avatar.setAttribute('aria-hidden', 'true');
  const copy = element('div'); copy.append(element('h3', doctor.name), element('p', doctor.specialization, 'muted'));
  info.append(avatar, copy); card.append(info, button('View times', 'button-secondary', () => loadSlots(doctor))); return card;
}
async function loadDoctors(specialization = $('#search-form').elements.specialization.value.trim()) {
  const result = await request(`/api/doctors?${new URLSearchParams({ specialization })}`); state.doctors = result.doctors;
  const list = $('#doctor-list'); list.replaceChildren();
  if (!result.doctors.length) return empty(list, 'No doctors found. Try another specialization.');
  result.doctors.forEach(doctor => list.append(doctorCard(doctor)));
}
formHandler('#search-form', async data => { await loadDoctors(data.get('specialization').trim()); });
$('#clear-search').addEventListener('click', async () => {
  $('#search-form').reset(); try { await loadDoctors(''); } catch (error) { notice(error.message, true); }
});
async function loadSlots(doctor) {
  state.selectedDoctor = doctor;
  $('#slot-heading').textContent = doctor.name; $('#slot-help').textContent = `${doctor.specialization} · Available appointment times`;
  const result = await request(`/api/slots?${new URLSearchParams({ doctorId: doctor.id })}`);
  const list = $('#slot-list'); list.replaceChildren();
  if (!result.slots.length) return empty(list, 'No available time slots. Please check back later.');
  result.slots.forEach(slot => {
    const row = element('div', undefined, 'slot');
    row.append(element('span', `${slot.date} at ${slot.time}`));
    if (state.user.role === 'patient') row.append(button('Book', 'button-primary', async () => {
      await request('/api/appointments', { method: 'POST', body: { slotId: slot.id } });
      notice(`Appointment booked with ${doctor.name} for ${slot.date} at ${slot.time}.`); await loadSlots(doctor);
    }));
    list.append(row);
  });
}
function appointmentCard(item, admin) {
  const card = element('div', undefined, 'card appointment-card'); const info = element('div');
  info.append(element('h3', item.doctorName), element('p', `${item.specialization} · ${item.date} at ${item.time}`, 'muted'));
  if (admin) info.append(element('p', `${item.patientName} · ${item.patientEmail}`, 'muted'));
  const controls = element('div'); const isCancelled = item.status.toLowerCase() === 'cancelled';
  controls.append(element('span', item.status, isCancelled ? 'badge cancelled' : 'badge'));
  if (!isCancelled) { controls.append(document.createTextNode(' '), button('Cancel', 'button-danger', async () => {
    if (!window.confirm('Cancel this appointment?')) return;
    await request(`/api/appointments/${item.id}/cancel`, { method: 'POST' });
    notice('Appointment cancelled.'); if (admin) await loadAdminAppointments(); else await loadAppointments();
  })); }
  card.append(info, controls); return card;
}
async function loadAppointments() {
  const result = await request('/api/appointments'); const list = $('#appointment-list'); list.replaceChildren();
  if (!result.appointments.length) return empty(list, 'No appointments yet. Find a doctor to make a booking.');
  result.appointments.forEach(item => list.append(appointmentCard(item, false)));
}
$('#refresh-appointments').addEventListener('click', () => loadAppointments().catch(error => notice(error.message, true)));
async function loadAdminDoctors() {
  const result = await request('/api/doctors'); const list = $('#admin-doctors'); const select = $('#slot-form').elements.doctorId;
  const selected = select.value; list.replaceChildren(); select.replaceChildren(new Option('Select a doctor', ''));
  if (!result.doctors.length) empty(list, 'Add a doctor to get started.');
  result.doctors.forEach(doctor => { list.append(element('p', `${doctor.name} · ${doctor.specialization}`, 'muted')); select.append(new Option(`${doctor.name} · ${doctor.specialization}`, doctor.id)); });
  if (result.doctors.some(doctor => String(doctor.id) === selected)) select.value = selected;
}
async function loadAdminAppointments() {
  const result = await request('/api/admin/appointments'); const list = $('#admin-appointments'); list.replaceChildren();
  if (!result.appointments.length) return empty(list, 'No appointments have been booked.');
  result.appointments.forEach(item => list.append(appointmentCard(item, true)));
}
async function loadAdmin() { await Promise.all([loadAdminDoctors(), loadAdminAppointments()]); }
formHandler('#doctor-form', async (data, form) => {
  await request('/api/admin/doctors', { method: 'POST', body: { name: data.get('name'), specialization: data.get('specialization') } });
  form.reset(); await loadAdminDoctors(); notice('Doctor added.');
});
formHandler('#slot-form', async (data, form) => {
  await request('/api/admin/slots', { method: 'POST', body: { doctorId: Number(data.get('doctorId')), date: data.get('date'), time: data.get('time') } });
  form.elements.time.value = ''; notice('Available time slot added.');
});
$('#refresh-admin').addEventListener('click', () => loadAdmin().catch(error => notice(error.message, true)));
updateSession().catch(error => notice(error.message, true));
