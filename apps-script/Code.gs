/**
 * Teacher Note Assistant (TNA) - Apps Script API
 * - Đặt file này trong Google Sheet mẫu (Extensions -> Apps Script)
 * - Deploy -> Web app -> Execute as: Me | Who has access: Anyone
 * - Copy link /exec dán vào App (Cài đặt)
 * (Tùy chọn) set Script Properties: TNA_TOKEN để bật bảo vệ token
 */

const SHEET_STUDENTS = 'Students';
const SHEET_TIMETABLE = 'Timetable';
const SHEET_EVENTS = 'Events';

const STUDENTS_HEADERS_VN = [
  'student_id','ho_ten','lop','gioi_tinh','ngay_sinh','biet_danh','ghi_chu','trang_thai','cap_nhat_luc'
];

const TIMETABLE_HEADERS_VN = [
  'tuan','hieu_luc_tu','hieu_luc_den','thu','tiet','gio_bat_dau','gio_ket_thuc','lop','mon','phong'
];

const EVENTS_HEADERS_VN = [
  'event_id','thoi_gian','ngay','gio','tuan_key','thang_key','hoc_ky_key','nam_hoc',
  'teacher_id','teacher_name','role','lop','mon','phong','tiet','thu',
  'scope','student_id','student_name_snapshot','type','category','tags',
  'points','severity','raw_text','source','confidence',
  'is_tentative','created_at','updated_at',
  'is_deleted','deleted_at'
];

function doGet(e) {
  try {
    const action = (e.parameter.action || '').trim();
    const cb = (e.parameter.callback || '').trim();
    const token = (e.parameter.token || '').trim();
    assertToken_(token);

    if (action === 'ping') return respond_({ ok:true, version:'tna-gas-1.0', now: new Date().toISOString() }, cb);
    if (action === 'getStudents') return respond_({ ok:true, students: getStudents_() }, cb);
    if (action === 'getTimetable') return respond_({ ok:true, timetable: getTimetable_() }, cb);

    return respond_({ ok:false, error:'Action không hợp lệ: ' + action }, cb);
  } catch (err) {
    return respond_({ ok:false, error: (err && err.message) ? err.message : String(err) }, (e && e.parameter && e.parameter.callback) ? e.parameter.callback : '');
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) ? e.postData.contents : '{}');
    const action = (body.action || '').trim();
    const token = (body.token || '').trim();
    assertToken_(token);

    if (action === 'appendEvents') {
      const events = body.events || [];
      appendEvents_(events);
      return respond_({ ok:true, appended: events.length });
    }
    if (action === 'softDeleteEvents') {
      const ids = body.event_ids || [];
      softDeleteEvents_(ids);
      return respond_({ ok:true, deleted: ids.length });
    }
    if (action === 'replaceTimetable') {
      const rows = body.rows || [];
      replaceTimetable_(rows);
      return respond_({ ok:true, rows: rows.length });
    }
    if (action === 'replaceStudents') {
      const rows = body.rows || [];
      replaceStudents_(rows);
      return respond_({ ok:true, rows: rows.length });
    }

    return respond_({ ok:false, error:'Action không hợp lệ: ' + action });
  } catch (err) {
    return respond_({ ok:false, error: (err && err.message) ? err.message : String(err) });
  }
}

/** ===== Core helpers ===== */

function assertToken_(incomingToken) {
  const props = PropertiesService.getScriptProperties();
  const required = (props.getProperty('TNA_TOKEN') || '').trim();
  if (!required) return; // no token -> public by link
  if (incomingToken !== required) throw new Error('Sai token. Vui lòng kiểm tra TNA_TOKEN và token trong App.');
}

function respond_(obj, callbackName) {
  const payload = JSON.stringify(obj);
  if (callbackName) {
    return ContentService.createTextOutput(callbackName + '(' + payload + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  ensureHeaders_(sh, headers);
  return sh;
}

function ensureHeaders_(sh, headers) {
  const firstRow = sh.getRange(1, 1, 1, Math.max(1, headers.length)).getValues()[0];
  const ok = headers.every((h, i) => String(firstRow[i] || '').trim() === h);
  if (!ok) {
    sh.clearContents();
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
}

/** ===== Students ===== */
function getStudents_() {
  const sh = getOrCreateSheet_(SHEET_STUDENTS, STUDENTS_HEADERS_VN);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const header = values[0].map(String);

  const idx = (key) => header.indexOf(key);
  const out = [];
  for (let r=1; r<values.length; r++) {
    const row = values[r];
    const student_id = String(row[idx('student_id')] || '').trim();
    if (!student_id) continue;
    out.push({
      student_id,
      full_name: String(row[idx('ho_ten')] || '').trim(),
      class_code: String(row[idx('lop')] || '').trim(),
      gender: String(row[idx('gioi_tinh')] || '').trim(),
      dob: String(row[idx('ngay_sinh')] || '').trim(),
      aliases: String(row[idx('biet_danh')] || '').trim(),
      profile_note: String(row[idx('ghi_chu')] || '').trim(),
      status: String(row[idx('trang_thai')] || 'ACTIVE').trim(),
      updated_at: String(row[idx('cap_nhat_luc')] || '').trim()
    });
  }
  return out;
}

function replaceStudents_(rows) {
  const sh = getOrCreateSheet_(SHEET_STUDENTS, STUDENTS_HEADERS_VN);
  sh.clearContents();
  sh.getRange(1,1,1,STUDENTS_HEADERS_VN.length).setValues([STUDENTS_HEADERS_VN]);
  const out = [];
  rows.forEach(s => {
    out.push([
      s.student_id || '',
      s.full_name || '',
      s.class_code || '',
      s.gender || '',
      s.dob || '',
      s.aliases || '',
      s.profile_note || '',
      s.status || 'ACTIVE',
      s.updated_at || new Date().toISOString()
    ]);
  });
  if (out.length) sh.getRange(2,1,out.length,STUDENTS_HEADERS_VN.length).setValues(out);
  sh.setFrozenRows(1);
}

/** ===== Timetable ===== */
function getTimetable_() {
  const sh = getOrCreateSheet_(SHEET_TIMETABLE, TIMETABLE_HEADERS_VN);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const header = values[0].map(String);
  const idx = (key) => header.indexOf(key);
  const out = [];
  for (let r=1; r<values.length; r++) {
    const row = values[r];
    const thuRaw = String(row[idx('thu')] || '').trim();
    const periodRaw = row[idx('tiet')];
    const class_code = String(row[idx('lop')] || '').trim();
    if (!thuRaw || !periodRaw || !class_code) continue;

    const dayNum = parseThu_(thuRaw);
    const period = Number(periodRaw);

    out.push({
      week_key: String(row[idx('tuan')] || '').trim(),
      effective_from: String(row[idx('hieu_luc_tu')] || '').trim(),
      effective_to: String(row[idx('hieu_luc_den')] || '').trim(),
      day_of_week: dayNum,
      period,
      start_time: String(row[idx('gio_bat_dau')] || '').trim(),
      end_time: String(row[idx('gio_ket_thuc')] || '').trim(),
      class_code,
      subject: String(row[idx('mon')] || '').trim(),
      room: String(row[idx('phong')] || '').trim()
    });
  }
  return out;
}

function replaceTimetable_(rows) {
  const sh = getOrCreateSheet_(SHEET_TIMETABLE, TIMETABLE_HEADERS_VN);
  sh.clearContents();
  sh.getRange(1,1,1,TIMETABLE_HEADERS_VN.length).setValues([TIMETABLE_HEADERS_VN]);

  const out = [];
  rows.forEach(t => {
    out.push([
      t.week_key || '',
      t.effective_from || '',
      t.effective_to || '',
      thuToText_(t.day_of_week),
      t.period || '',
      t.start_time || '',
      t.end_time || '',
      t.class_code || '',
      t.subject || '',
      t.room || ''
    ]);
  });
  if (out.length) sh.getRange(2,1,out.length,TIMETABLE_HEADERS_VN.length).setValues(out);
  sh.setFrozenRows(1);
}

function parseThu_(thuRaw) {
  const s = String(thuRaw).toLowerCase().replace(/\s+/g,'').replace('thứ','thu');
  // accept: 2..8, thu2..thu8
  const m = s.match(/(2|3|4|5|6|7|8)/);
  const n = m ? Number(m[1]) : 2;
  return n;
}

function thuToText_(n) {
  return 'Thứ ' + String(n);
}

/** ===== Events ===== */
function appendEvents_(events) {
  const sh = getOrCreateSheet_(SHEET_EVENTS, EVENTS_HEADERS_VN);
  const values = [];
  events.forEach(e => {
    const now = new Date().toISOString();
    values.push([
      e.event_id || '',
      e.timestamp || '',
      e.date || '',
      e.time || '',
      e.week_key || '',
      e.month_key || '',
      e.semester_key || '',
      e.school_year || '',
      e.teacher_id || '',
      e.teacher_name || '',
      e.role || '',
      e.class_code || '',
      e.subject || '',
      e.room || '',
      e.period || '',
      e.day_of_week || '',
      e.scope || '',
      e.student_id || '',
      e.student_name_snapshot || '',
      e.type || '',
      e.category || '',
      e.tags || '',
      e.points || '',
      e.severity || '',
      e.raw_text || '',
      e.source || '',
      e.confidence || '',
      e.is_tentative ? 'TRUE' : 'FALSE',
      e.created_at || now,
      e.updated_at || now,
      'FALSE',
      ''
    ]);
  });
  if (values.length) sh.getRange(sh.getLastRow()+1, 1, values.length, EVENTS_HEADERS_VN.length).setValues(values);
}

function softDeleteEvents_(eventIds) {
  if (!eventIds || !eventIds.length) return;
  const sh = getOrCreateSheet_(SHEET_EVENTS, EVENTS_HEADERS_VN);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;

  const idCol = 1; // event_id
  const delCol = EVENTS_HEADERS_VN.indexOf('is_deleted') + 1;
  const delAtCol = EVENTS_HEADERS_VN.indexOf('deleted_at') + 1;

  const ids = sh.getRange(2, idCol, lastRow-1, 1).getValues().map(r => String(r[0]||'').trim());
  const idToRow = {};
  ids.forEach((id, i) => { if (id) idToRow[id] = i+2; });

  const now = new Date().toISOString();
  eventIds.forEach(id => {
    const row = idToRow[id];
    if (row) {
      sh.getRange(row, delCol).setValue('TRUE');
      sh.getRange(row, delAtCol).setValue(now);
    }
  });
}
