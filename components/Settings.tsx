import React, { useMemo, useState } from 'react';
import { ChipGroup, EventType, SheetConfig, UserProfile } from '../types';
import { Plus, Trash2, Edit2, Save, X, RefreshCw, Download, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { normalizeAppsScriptUrl } from '../appScriptApi';

interface SettingsProps {
  chipGroups: ChipGroup[];
  onUpdateGroups: (groups: ChipGroup[]) => void;

  sheetConfig: SheetConfig;
  onUpdateSheetConfig: (config: SheetConfig) => void;

  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;

  availableClasses: string[];

  onSyncAll: () => void;
  onSyncStudents: () => void;
  onSyncTimetable: () => void;
  onSyncEvents: () => void;
  onExport: () => void;
}

const APPS_SCRIPT_CODE = `/**
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
`;

const Settings: React.FC<SettingsProps> = ({
  chipGroups,
  onUpdateGroups,
  sheetConfig,
  onUpdateSheetConfig,
  userProfile,
  onUpdateUserProfile,
  availableClasses,
  onSyncAll,
  onSyncStudents,
  onSyncTimetable,
  onSyncEvents,
  onExport
}) => {
  // Profile temp
  const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);

  // Sheet config temp
  const [tempUrl, setTempUrl] = useState(sheetConfig.appsScriptUrl || '');
  const [tempToken, setTempToken] = useState(sheetConfig.appsScriptToken || '');
  const [copied, setCopied] = useState(false);

  // Chip editing
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState('');
  const [addingChipToGroupId, setAddingChipToGroupId] = useState<string | null>(null);
  const [newChipLabel, setNewChipLabel] = useState('');
  const [newChipType, setNewChipType] = useState<EventType>(EventType.VIOLATION);

  const saveSheetConfig = () => {
    const normalized = normalizeAppsScriptUrl(tempUrl);
    onUpdateSheetConfig({
      ...sheetConfig,
      appsScriptUrl: normalized,
      appsScriptToken: tempToken
    });
    alert('Đã lưu cấu hình kết nối Apps Script!');
  };

  const handleSaveProfile = () => {
    onUpdateUserProfile(tempProfile);
    alert('Đã cập nhật hồ sơ giáo viên!');
  };

  const handleAddGroup = () => {
    const newGroup: ChipGroup = { id: `g-${Date.now()}`, name: 'Nhóm mới', chips: [] };
    onUpdateGroups([...chipGroups, newGroup]);
    setEditingGroupId(newGroup.id);
    setTempGroupName(newGroup.name);
  };

  const handleDeleteGroup = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này không?')) return;
    onUpdateGroups(chipGroups.filter(g => g.id !== id));
  };

  const handleSaveGroupName = (id: string) => {
    onUpdateGroups(chipGroups.map(g => g.id === id ? { ...g, name: tempGroupName } : g));
    setEditingGroupId(null);
  };

  const handleAddChip = (groupId: string) => {
    if (!newChipLabel.trim()) return;
    const updated = chipGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        chips: [
          ...g.chips,
          {
            id: `c-${Date.now()}`,
            label: newChipLabel.trim(),
            type: newChipType
          }
        ]
      };
    });
    onUpdateGroups(updated);
    setNewChipLabel('');
    setAddingChipToGroupId(null);
  };

  const handleDeleteChip = (groupId: string, chipId: string) => {
    onUpdateGroups(chipGroups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, chips: g.chips.filter(c => c.id !== chipId) };
    }));
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Không copy được. Bạn hãy bôi đen và copy thủ công.');
    }
  };

  const homeroomOptions = useMemo(() => [''].concat(availableClasses), [availableClasses]);

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="font-semibold text-lg">Hồ sơ giáo viên</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">Tên giáo viên</div>
            <input className="w-full border rounded-lg px-3 py-2"
              value={tempProfile.teacherName}
              onChange={e => setTempProfile({ ...tempProfile, teacherName: e.target.value })} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Email (ID)</div>
            <input className="w-full border rounded-lg px-3 py-2"
              value={tempProfile.teacherEmail}
              onChange={e => setTempProfile({ ...tempProfile, teacherEmail: e.target.value })} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Bạn là GVCN lớp</div>
            <select className="w-full border rounded-lg px-3 py-2"
              value={tempProfile.homeroomClass || ''}
              onChange={e => setTempProfile({ ...tempProfile, homeroomClass: e.target.value })}>
              {homeroomOptions.map(c => <option key={c} value={c}>{c || '(Không)'}</option>)}
            </select>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Phóng to/thu nhỏ giao diện</div>
            <input type="range" min={75} max={130} step={5}
              value={tempProfile.uiScale || 100}
              onChange={e => setTempProfile({ ...tempProfile, uiScale: Number(e.target.value) })} />
            <div className="text-xs text-gray-500">Hiện tại: {tempProfile.uiScale || 100}%</div>
          </div>
        </div>
        <button onClick={handleSaveProfile} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
          <Save size={16} /> Lưu hồ sơ
        </button>
      </div>

      {/* Apps Script Connect */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="font-semibold text-lg">Kết nối Google Sheet bằng Apps Script (không dùng Sheets API)</div>

        <div className="text-sm text-gray-700">
          Cách làm nhanh: (1) Tạo/copy file Google Sheet mẫu → (2) Mở Extensions → Apps Script, dán code → Deploy Web App (Anyone) → (3) Copy link <b>/exec</b> dán vào đây.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">Link Web App Apps Script (kết thúc /exec)</div>
            <div className="flex gap-2">
              <input className="flex-1 border rounded-lg px-3 py-2"
                placeholder="https://script.google.com/macros/s/...../exec"
                value={tempUrl}
                onChange={e => setTempUrl(e.target.value)} />
              <a className="px-3 py-2 border rounded-lg inline-flex items-center gap-1"
                href={tempUrl ? normalizeAppsScriptUrl(tempUrl) : '#'}
                target="_blank" rel="noreferrer">
                <LinkIcon size={16} /> mở
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Token (tùy chọn)</div>
            <input className="w-full border rounded-lg px-3 py-2"
              placeholder="(để trống nếu không đặt TNA_TOKEN)"
              value={tempToken}
              onChange={e => setTempToken(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={saveSheetConfig} className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg">
            <Save size={16} /> Lưu kết nối
          </button>
          <button onClick={onSyncStudents} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg">
            <RefreshCw size={16} /> Đồng bộ Học sinh
          </button>
          <button onClick={onSyncTimetable} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg">
            <RefreshCw size={16} /> Đồng bộ TKB
          </button>
          <button onClick={onSyncEvents} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg">
            <RefreshCw size={16} /> Đồng bộ Sự kiện
          </button>
          <button onClick={onSyncAll} className="inline-flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg">
            <RefreshCw size={16} /> Đồng bộ Tất cả
          </button>
          <button onClick={onExport} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg">
            <Download size={16} /> Xuất dữ liệu (JSON)
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Lần đồng bộ gần nhất: {sheetConfig.lastSyncedAt || '(chưa có)'}<br />Học sinh: {(sheetConfig as any).lastSyncedStudentsAt || '(chưa có)'}<br />TKB: {(sheetConfig as any).lastSyncedTimetableAt || '(chưa có)'}<br />Sự kiện: {(sheetConfig as any).lastSyncedEventsAt || '(chưa có)'}
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-semibold">Code Apps Script mẫu (bấm để mở)</summary>
          <div className="mt-2 space-y-2">
            <button onClick={copyCode} className="inline-flex items-center gap-2 border px-3 py-2 rounded-lg">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Đã copy' : 'Copy code'}
            </button>
            <pre className="text-xs bg-gray-50 border rounded-lg p-3 overflow-auto max-h-[420px]">{APPS_SCRIPT_CODE}</pre>
          </div>
        </details>
      </div>

      {/* Chip Groups */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-lg">Chip (Tag) bấm nhanh</div>
          <button onClick={handleAddGroup} className="inline-flex items-center gap-2 border px-3 py-2 rounded-lg">
            <Plus size={16} /> Thêm nhóm
          </button>
        </div>

        <div className="space-y-3">
          {chipGroups.map(group => (
            <div key={group.id} className="border rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                {editingGroupId === group.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input className="flex-1 border rounded-lg px-3 py-2"
                      value={tempGroupName}
                      onChange={e => setTempGroupName(e.target.value)} />
                    <button onClick={() => handleSaveGroupName(group.id)} className="px-3 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center gap-1">
                      <Save size={16} /> Lưu
                    </button>
                    <button onClick={() => setEditingGroupId(null)} className="px-3 py-2 border rounded-lg inline-flex items-center gap-1">
                      <X size={16} /> Hủy
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="font-semibold">{group.name}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingGroupId(group.id); setTempGroupName(group.name); }} className="p-2 border rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteGroup(group.id)} className="p-2 border rounded-lg text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {group.chips.map(chip => (
                  <span key={chip.id} className="inline-flex items-center gap-2 px-3 py-1 border rounded-full text-sm">
                    <span className={chip.type === EventType.PRAISE ? 'text-green-700' : chip.type === EventType.VIOLATION ? 'text-red-700' : 'text-gray-700'}>
                      {chip.label}
                    </span>
                    <button onClick={() => handleDeleteChip(group.id, chip.id)} className="text-gray-500 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </span>
                ))}
              </div>

              {addingChipToGroupId === group.id ? (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input className="border rounded-lg px-3 py-2"
                    placeholder="Tên chip (vd: Nói chuyện riêng)"
                    value={newChipLabel}
                    onChange={e => setNewChipLabel(e.target.value)} />
                  <select className="border rounded-lg px-3 py-2"
                    value={newChipType}
                    onChange={e => setNewChipType(e.target.value as EventType)}>
                    <option value={EventType.VIOLATION}>Lỗi (VIOLATION)</option>
                    <option value={EventType.PRAISE}>Khen (PRAISE)</option>
                    <option value={EventType.NOTE}>Ghi chú (NOTE)</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => handleAddChip(group.id)} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg">
                      Thêm
                    </button>
                    <button onClick={() => setAddingChipToGroupId(null)} className="px-3 py-2 border rounded-lg">
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingChipToGroupId(group.id)} className="mt-3 inline-flex items-center gap-2 border px-3 py-2 rounded-lg">
                  <Plus size={16} /> Thêm chip
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Settings;
