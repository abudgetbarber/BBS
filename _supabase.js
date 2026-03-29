// ════════════════════════════════════════════════════════════════
//  BUDGET BARBER — SUPABASE DATA LAYER  (shared across all pages)
//  Replace placeholders before deploying:
//    YOUR_SUPABASE_URL   →  https://xxxx.supabase.co
//    YOUR_SUPABASE_ANON_KEY  →  eyJ...
// ════════════════════════════════════════════════════════════════

var SUPA_URL  = 'https://socgmrzzovpqaekpsklv.supabase.co';
var SUPA_KEY  = 'sb_publishable_Aw-xgcvVKyPSxOi4rKa7sQ_830lOSuQ';

// ── Low-level REST helpers ──────────────────────────────────────
function _supaHeaders(){
  return {
    'Content-Type':  'application/json',
    'apikey':        SUPA_KEY,
    'Authorization': 'Bearer ' + SUPA_KEY,
    'Prefer':        'return=representation'
  };
}

function _supaFetch(path, opts){
  return fetch(SUPA_URL + '/rest/v1/' + path, Object.assign({
    headers: _supaHeaders()
  }, opts)).then(function(r){
    if(!r.ok) return r.text().then(function(t){ throw new Error(t); });
    var ct = r.headers.get('content-type')||'';
    return ct.indexOf('application/json') !== -1 ? r.json() : [];
  });
}

// ── CRUD wrappers ───────────────────────────────────────────────
// SELECT  — table, optional query-string filters e.g. "salonId=eq.S1&role=eq.barber"
function sbSelect(table, qs){
  return _supaFetch(table + (qs ? '?' + qs : ''), { method:'GET' });
}

// INSERT single row — returns the new row
function sbInsert(table, row){
  return _supaFetch(table, { method:'POST', body: JSON.stringify(row) })
    .then(function(rows){ return Array.isArray(rows) ? rows[0] : rows; });
}

// UPSERT — insert or update by id
function sbUpsert(table, row){
  return _supaFetch(table + '?on_conflict=id', {
    method: 'POST',
    headers: Object.assign(_supaHeaders(), { 'Prefer': 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(row)
  }).then(function(rows){ return Array.isArray(rows) ? rows[0] : rows; });
}

// UPDATE by id
function sbUpdate(table, id, patch){
  return _supaFetch(table + '?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    body: JSON.stringify(patch)
  }).then(function(rows){ return Array.isArray(rows) ? rows[0] : rows; });
}

// DELETE by id
function sbDelete(table, id){
  return _supaFetch(table + '?id=eq.' + encodeURIComponent(id), { method:'DELETE' });
}

// ── Named table accessors (mirrors old sheet names) ─────────────
// Each returns a Promise

var SB = {
  // ─ READ ALL (used for bootstrap cache) ─
  readAll: function(){
    return Promise.all([
      sbSelect('staff'),
      sbSelect('salons'),
      sbSelect('customers'),
      sbSelect('entries'),
      sbSelect('cash_in'),
      sbSelect('expenses'),
      sbSelect('attendance'),
      sbSelect('style_cards'),
      sbSelect('visits'),
      sbSelect('advances'),
      sbSelect('mgr_cash_in'),
      sbSelect('mgr_expenses'),
      sbSelect('deductions'),
      sbSelect('att_overrides')
    ]).then(function(results){
      return {
        staff:        results[0]  || [],
        salons:       results[1]  || [],
        customers:    results[2]  || [],
        entries:      results[3]  || [],
        cashIn:       results[4]  || [],
        expenses:     results[5]  || [],
        attendance:   results[6]  || [],
        styleCards:   results[7]  || [],
        visits:       results[8]  || [],
        advances:     results[9]  || [],
        mgrCashIn:    results[10] || [],
        mgrExpenses:  results[11] || [],
        deductions:   results[12] || [],
        attOverrides: results[13] || []
      };
    });
  },

  // ─ ENTRIES ─
  insertEntry:  function(r){ return sbInsert('entries', r); },
  updateEntry:  function(r){ return sbUpdate('entries', r.id, r); },
  deleteEntry:  function(id){ return sbDelete('entries', id); },

  // ─ STAFF ─
  insertStaff:  function(r){ return sbInsert('staff', r); },
  updateStaff:  function(r){ return sbUpdate('staff', r.id, r); },
  deleteStaff:  function(id){ return sbDelete('staff', id); },

  // ─ SALONS ─
  insertSalon:  function(r){ return sbInsert('salons', r); },
  updateSalon:  function(r){ return sbUpdate('salons', r.id, r); },
  deleteSalon:  function(id){ return sbDelete('salons', id); },

  // ─ CUSTOMERS ─
  insertCustomer: function(r){ return sbInsert('customers', r); },
  updateCustomer: function(r){ return sbUpdate('customers', r.id, r); },
  deleteCustomer: function(id){ return sbDelete('customers', id); },

  // ─ CASH IN ─
  insertCashIn: function(r){ return sbInsert('cash_in', r); },

  // ─ EXPENSES ─
  insertExpense: function(r){ return sbInsert('expenses', r); },

  // ─ ATTENDANCE ─
  insertAttendance: function(r){ return sbInsert('attendance', r); },

  // ─ STYLE CARDS ─
  insertStyleCard: function(r){ return sbInsert('style_cards', r); },
  updateStyleCard: function(r){ return sbUpdate('style_cards', r.id, r); },

  // ─ VISITS ─
  insertVisit: function(r){ return sbInsert('visits', r); },

  // ─ ADVANCES ─
  insertAdvance: function(r){ return sbInsert('advances', r); },

  // ─ MANAGER CASH IN ─
  insertMgrCashIn: function(r){ return sbInsert('mgr_cash_in', r); },

  // ─ MANAGER EXPENSES ─
  insertMgrExpense: function(r){ return sbInsert('mgr_expenses', r); },

  // ─ DEDUCTIONS ─
  upsertDeductions: function(staffId, month, items){
    // delete existing then insert new
    return _supaFetch('deductions?staff_id=eq.'+encodeURIComponent(staffId)+'&month=eq.'+encodeURIComponent(month),{method:'DELETE'})
      .then(function(){
        if(!items||!items.length) return [];
        var rows = items.map(function(d){ return {staff_id:staffId,month:month,desc:d.desc,amount:d.amount}; });
        return sbInsert('deductions', rows);
      });
  },

  // ─ ATT OVERRIDES ─
  upsertAttOverride: function(staffId, month, obj){
    return _supaFetch('att_overrides?staff_id=eq.'+encodeURIComponent(staffId)+'&month=eq.'+encodeURIComponent(month),{method:'DELETE'})
      .then(function(){
        return sbInsert('att_overrides',{staff_id:staffId,month:month,present:obj.present,half:obj.half,absent:obj.absent});
      });
  }
};

// ── Bootstrap: load all data → localStorage, then call cb ───────
// This is called once on app load. Supabase is source of truth.
function supaBootstrap(onDone, onError){
  SB.readAll().then(function(data){
    applyRestoredData(data);
    if(onDone) onDone(data);
  }).catch(function(err){
    console.warn('[BB] Supabase bootstrap failed:', err);
    if(onError) onError(err);
  });
}

// ── applyRestoredData — writes supabase data into localStorage ──
// (identical shape to old Google Sheets restore — keeps all app
//  render functions working without change)
function applyRestoredData(d){
  function toStr(r, keys){
    keys.forEach(function(k){ if(r[k]!==undefined&&r[k]!==null) r[k]=String(r[k]); });
    return r;
  }
  if(d.entries      && d.entries.length)      LS.set('entries',      d.entries.map(function(r){return toStr(r,['id','barberId','salonId','customerPhone']);}));
  if(d.staff        && d.staff.length)         LS.set('staff',        d.staff.map(function(r){return toStr(r,['id','phone','salonId','loginPin']);}));
  if(d.salons       && d.salons.length)        LS.set('salons',       d.salons.map(function(r){return toStr(r,['id','mgrPhone']);}));
  if(d.customers    && d.customers.length)     LS.set('customers',    d.customers.map(function(r){return toStr(r,['id','phone','loginPin']);}));
  if(d.cashIn       && d.cashIn.length)        LS.set('cashIn',       d.cashIn.map(function(r){return toStr(r,['barberId']);}));
  if(d.expenses     && d.expenses.length)      LS.set('expenses',     d.expenses.map(function(r){return toStr(r,['barberId']);}));
  if(d.attendance   && d.attendance.length)    LS.set('attendance',   d.attendance.map(function(r){return toStr(r,['barberId']);}));
  if(d.styleCards   && d.styleCards.length)    LS.set('styleCards',   d.styleCards.map(function(r){return toStr(r,['id','customerId','barberId','salonId']);}));
  if(d.visits       && d.visits.length)        LS.set('visits',       d.visits.map(function(r){return toStr(r,['id','customerId','barberId','salonId']);}));
  if(d.advances     && d.advances.length)      LS.set('advances',     d.advances.map(function(r){return toStr(r,['barberId']);}));
  if(d.mgrCashIn    && d.mgrCashIn.length)     LS.set('mgrCashIn',    d.mgrCashIn.map(function(r){return toStr(r,['managerId','salonId']);}));
  if(d.mgrExpenses  && d.mgrExpenses.length)   LS.set('mgrExpenses',  d.mgrExpenses.map(function(r){return toStr(r,['managerId','salonId']);}));
  if(d.deductions   && d.deductions.length){
    var dg={};
    d.deductions.forEach(function(r){
      var k='ded_'+(r.staff_id||r.staffId)+'_'+r.month;
      if(!dg[k])dg[k]=[];
      dg[k].push({desc:r.desc,amount:r.amount});
    });
    Object.keys(dg).forEach(function(k){LS.set(k,dg[k]);});
  }
  if(d.attOverrides && d.attOverrides.length){
    d.attOverrides.forEach(function(r){
      LS.set('att_'+(r.staff_id||r.staffId)+'_'+r.month,{present:r.present,half:r.half,absent:r.absent});
    });
  }
}

// ── Compatibility shims (replaces JSONP functions) ───────────────
// These match the exact call signatures used throughout all app files
// so zero changes needed in business logic.

function appendRowToSheet(sheetName, rowObj, onDone){
  var tbl = _sheetToTable(sheetName);
  if(!tbl){ if(onDone)onDone(false); return; }
  sbInsert(tbl, rowObj)
    .then(function(){ if(onDone)onDone(true); })
    .catch(function(e){ console.warn('[BB] insert '+tbl, e); if(onDone)onDone(false); });
}

function updateRowInSheet(sheetName, rowObj, onDone){
  var tbl = _sheetToTable(sheetName);
  if(!tbl||!rowObj.id){ if(onDone)onDone(false); return; }
  sbUpdate(tbl, rowObj.id, rowObj)
    .then(function(){ if(onDone)onDone(true); })
    .catch(function(e){ console.warn('[BB] update '+tbl, e); if(onDone)onDone(false); });
}

function deleteRowFromSheet(sheetName, id, onDone){
  var tbl = _sheetToTable(sheetName);
  if(!tbl){ if(onDone)onDone(false); return; }
  sbDelete(tbl, id)
    .then(function(){ if(onDone)onDone(true); })
    .catch(function(e){ console.warn('[BB] delete '+tbl, e); if(onDone)onDone(false); });
}

function fetchSheetRows(sheetName, filters, onDone){
  var tbl = _sheetToTable(sheetName);
  if(!tbl){ onDone([]); return; }
  var qs = '';
  if(filters) qs = Object.keys(filters).map(function(k){ return k+'=eq.'+encodeURIComponent(filters[k]); }).join('&');
  sbSelect(tbl, qs)
    .then(function(rows){ onDone(rows||[]); })
    .catch(function(){ onDone([]); });
}

function fetchFromSheets(url, onSuccess, onError){
  // url param ignored — we always use Supabase
  SB.readAll()
    .then(function(data){ onSuccess(data); })
    .catch(function(err){ onError(err&&err.message?err.message:String(err)); });
}

// Map Google Sheets tab names → Supabase table names
function _sheetToTable(name){
  var map = {
    'Entries':      'entries',
    'Staff':        'staff',
    'Salons':       'salons',
    'Customers':    'customers',
    'CashIn':       'cash_in',
    'Expenses':     'expenses',
    'Attendance':   'attendance',
    'StyleCards':   'style_cards',
    'Visits':       'visits',
    'Advances':     'advances',
    'MgrCashIn':    'mgr_cash_in',
    'MgrExpenses':  'mgr_expenses',
    'Deductions':   'deductions',
    'AttOverrides': 'att_overrides'
  };
  return map[name] || null;
}
