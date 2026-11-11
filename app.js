/* =====================================================================
 * 어그로우 (WereWolf) 학급용 마피아 엔진 - app.js
 * - 1단계에서 발급받은 본인의 FIREBASE_CONFIG와 구글 시트 ID를 아래에 입력하세요.
 * - 게임 종료 시 인포그래픽 포스터(.png) 및 스프레드시트(.csv) 다운로드 탑재
 * ===================================================================== */

// ★ [필수 입력 1] 파이어베이스 웹앱 설정값 붙여넣기
const FIREBASE_CONFIG = {
  apiKey: "여기에_FIREBASE_API_KEY_입력",
  authDomain: "프로젝트ID.firebaseapp.com",
  databaseURL: "https://프로젝트ID-default-rtdb.firebaseio.com",
  projectId: "프로젝트ID"
};

// ★ [선택 입력 2] 역할 관리용 구글 스프레드시트 ID (페르미 추정 방식 - '링크가 있는 모든 사용자 뷰어' 공유)
const ROLE_SHEET_ID = "";

// ★ 교사 스마트폰 시크릿 관제 접속용 PIN 번호
const TEACHER_PIN = "1234";

// 기본 19종 역할 데이터 (구글 시트 미연결 시 기본 작동)
let ROLES_DB = [
  { id: 'citizen', name: '시민', team: '시민', count: 10, startNight: 0, skill: 'NONE', uses: 0, img: 'images/citizen.png', icon: '🧑‍🌾', desc: '투표를 통해 늑대를 모두 처치하면 승리합니다. 첫날 낮에 시장을 선출합니다.' },
  { id: 'medium', name: '영혼술사', team: '시민', count: 1, startNight: 1, skill: 'MEDIUM', uses: 99, img: 'images/medium.png', icon: '🔮', desc: '매일 밤 수정구슬을 통해 죽은 사람(유령)으로부터 1글자 비밀 단서를 전달받습니다.' },
  { id: 'seer', name: '선견자', team: '시민', count: 1, startNight: 1, skill: 'INSPECT_ROLE', uses: 99, img: 'images/seer.png', icon: '🔭', desc: '매일 밤 플레이어 한 명을 클릭해 즉시 정체를 알아낼 수 있습니다.' },
  { id: 'hunter', name: '사냥꾼', team: '시민', count: 1, startNight: 0, skill: 'REVENGE_ON_DEATH', uses: 1, img: 'images/hunter.png', icon: '🔫', desc: '늑대 습격이나 낮 투표로 처치당할 때 같이 처치당할 다른 한 명을 즉시 고를 수 있습니다.' },
  { id: 'technician', name: '기술자', team: '시민', count: 1, startNight: 3, skill: 'COUNT_WOLVES', uses: 99, img: 'images/technician.png', icon: '⚙️', desc: '3번째 밤부터 남아 있는 늑대의 수를 알려주는 기계를 통해 매일 밤 늑대 수를 확인합니다.' },
  { id: 'wizard', name: '마법사', team: '시민', count: 1, startNight: 1, skill: 'WIZARD_MAGIC', uses: 99, img: 'images/wizard.png', icon: '🧙‍♂️', desc: '매일 밤 한 명을 지정해 보호 마법을 걸거나 독 마법을 걸 수 있습니다 (택1).' },
  { id: 'guard', name: '경비병', team: '시민', count: 1, startNight: 1, skill: 'GUARD_2', uses: 99, img: 'images/guard.png', icon: '🛡️', desc: '매일 밤 최대 두 명을 보호하여 마법사의 독과 늑대의 습격·감염을 막습니다.' },
  { id: 'priest', name: '성직자', team: '시민', count: 1, startNight: 3, skill: 'PRIEST_REVIVE', uses: 1, img: 'images/priest.png', icon: '🙏', desc: '3번째 밤까지 무적. 3번째 밤부터 산 사람 1명을 희생해 죽은 사람 1명을 수도승으로 부활시킵니다.' },
  { id: 'monk', name: '수도승', team: '시민', count: 0, startNight: 0, skill: 'NONE', uses: 0, img: 'images/monk.png', icon: '📿', desc: '성직자에 의해 부활한 사람입니다. 말과 손짓 제스처를 하지 못하며 낮에도 이동이 안 됩니다.' },
  { id: 'jester', name: '광대', team: '시민', count: 1, startNight: 1, skill: 'SILENCE', uses: 99, img: 'images/jester.png', icon: '🤡', desc: '매일 밤 한 명을 지정해 다음 날 아침 아무 말도 하지 못하도록 마법을 겁니다.' },
  { id: 'assassin', name: '암살자', team: '단독', count: 1, startNight: 1, skill: 'ASSASSINATE', uses: 99, img: 'images/assassin.png', icon: '🗡️', desc: '기상학자를 암살하고 최후까지 살아남으면 승리합니다. 실패 시 다음 밤 행동 불가.' },
  { id: 'werewolf', name: '늑대인간', team: '늑대', count: 1, startNight: 1, skill: 'WOLF_CORE', uses: 99, img: 'images/werewolf.png', icon: '🐺', desc: '매일 밤 시민을 해치거나 감염(본인 포함 최대 6명)시킵니다. 늑대 수가 시민의 절반이 되면 승리.' },
  { id: 'wolf_detective', name: '탐정 늑대', team: '늑대', count: 0, startNight: 1, skill: 'INSPECT_ROLE', uses: 99, img: 'images/wolf_detective.png', icon: '🕵️‍♂️', desc: '첫 번째로 감염된 늑대입니다. 밤마다 시민 한 명의 직업을 알아낼 수 있습니다.' },
  { id: 'wolf_chemist', name: '약사 늑대', team: '늑대', count: 0, startNight: 0, skill: 'CHEMIST_PASSIVE', uses: 99, img: 'images/wolf_chemist.png', icon: '🧪', desc: '두 번째로 감염된 늑대입니다. 살아있는 동안 모든 늑대는 마법사의 독 공격에 면역이 됩니다.' },
  { id: 'wolf_witch', name: '부두술사 늑대', team: '늑대', count: 0, startNight: 0, skill: 'WITCH_PASSIVE', uses: 99, img: 'images/wolf_witch.png', icon: '🦯', desc: '세 번째로 감염된 늑대입니다. 살아있는 동안 한 번에 두 명의 시민을 감염시킬 수 있습니다.' },
  { id: 'fraud', name: '사기꾼', team: '늑대', count: 1, startNight: 0, skill: 'FRAUD_PASSIVE', uses: 1, img: 'images/fraud.png', icon: '🃏', desc: '선견자에게 시민으로 위장하며, 낮 투표 처형 시 1회 한정 랜덤 1명을 대신 처형시킵니다.' },
  { id: 'white_wolf', name: '하얀 늑대', team: '단독', count: 1, startNight: 1, skill: 'WHITE_WOLF', uses: 99, img: 'images/white_wolf.png', icon: '🤍', desc: '매일 밤 정체를 조사하고 처치합니다. 시민 5명 이하+늑대 전멸 시 단독 승리.' },
  { id: 'meteorologist', name: '기상학자', team: '단독', count: 1, startNight: 4, skill: 'TORNADO', uses: 2, img: 'images/meteorologist.png', icon: '🌪️', desc: '4번째 밤부터 생존자 30%를 날려버리는 토네이도를 2회 작동합니다. 혼자 생존 시 승리.' },
  { id: 'agent', name: '공작원', team: '단독', count: 1, startNight: 0, skill: 'WIN_ON_VOTE', uses: 1, img: 'images/agent.png', icon: '🕶️', desc: '낮 투표로 처형당하게 되면 게임이 즉시 종료되며 단독 승리합니다.' }
];

const EXCLUDED_FROM_SETUP = ['citizen', 'monk', 'wolf_detective', 'wolf_chemist', 'wolf_witch'];

let db = null;
let auth = null;
let myUid = null;
let currentRoom = null;
let isTeacher = false;
let roomCache = { public: {}, players: {}, secrets: {}, actions: {}, logs: [] };
let mySecret = null;
let selectedSubMode = 'WOLF_KILL';
let multiTargets = [];
let timerInterval = null;
let idleDisconnectTimer = null;

window.addEventListener('DOMContentLoaded', () => {
  renderRoleConfigUI();
  connectFirebaseDirect();
  loadRolesFromGoogleSheet(false);
  resetIdleDisconnectTimer();

  ['click', 'touchstart', 'keydown'].forEach(evt => {
    window.addEventListener(evt, resetIdleDisconnectTimer, { passive: true });
  });

  const params = new URLSearchParams(location.search);
  if (params.get('room')) {
    document.getElementById('joinRoomInput').value = params.get('room');
  }
});

// 20분 무조작 시 자동 오프라인 전환 (무료 동시접속 100명 한도 보호)
function resetIdleDisconnectTimer() {
  clearTimeout(idleDisconnectTimer);
  if (db) {
    try { firebase.database().goOnline(); } catch (e) {}
  }
  idleDisconnectTimer = setTimeout(() => {
    if (db) {
      firebase.database().goOffline();
      const badge = document.getElementById('connBadge');
      badge.textContent = '절전 대기중 (터치 시 재연결)';
      badge.className = 'status-pill offline';
    }
  }, 20 * 60 * 1000);
}

function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
}

/* =====================================================================
 * 1. 파이어베이스 직접 연결 (익명 인증) & 구글 시트 실시간 역할 로드
 * ===================================================================== */
function connectFirebaseDirect() {
  if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey.includes('여기에')) {
    document.getElementById('connBadge').textContent = 'app.js에 키 입력 필요';
    return;
  }
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    auth = firebase.auth();
    db = firebase.database();

    auth.signInAnonymously().then(cred => {
      myUid = cred.user.uid;
      const badge = document.getElementById('connBadge');
      badge.textContent = '🔒 보안 연결됨';
      badge.className = 'status-pill online';
    }).catch(err => {
      alert('파이어베이스 콘솔에서 [익명(Anonymous) 로그인]을 켜주세요: ' + err.message);
    });
  } catch (e) {
    console.error(e);
  }
}

// <페르미 추정>과 동일한 GVIZ 방식으로 Code.gs 웹앱 배포 없이 시트 실시간 연동
async function loadRolesFromGoogleSheet(showAlert) {
  if (!ROLE_SHEET_ID) return;
  try {
    const url = `https://docs.google.com/spreadsheets/d/${ROLE_SHEET_ID}/gviz/tq?tqx=out:json&_=${Date.now()}`;
    const res = await fetch(url);
    const text = await res.text();
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(jsonStr);
    const rows = data.table.rows || [];

    const parsed = [];
    rows.forEach(r => {
      const c = r.c || [];
      const id = c[0]?.v ? String(c[0].v).trim() : '';
      if (!id || id === '역할ID') return;
      parsed.push({
        id,
        name: String(c[1]?.v || '').trim(),
        team: String(c[2]?.v || '시민').trim(),
        count: Number(c[3]?.v ?? 0),
        startNight: Number(c[4]?.v ?? 0),
        skill: String(c[5]?.v || 'NONE').trim(),
        uses: Number(c[6]?.v ?? 0),
        img: String(c[7]?.v || '').trim(),
        icon: String(c[8]?.v || '🎭').trim(),
        desc: String(c[9]?.v || '').trim()
      });
    });

    if (parsed.length > 0) {
      ROLES_DB = parsed;
      renderRoleConfigUI();
      const sb = document.getElementById('sheetBadge');
      sb.textContent = `📊 시트 연동됨 (${ROLES_DB.length}종)`;
      sb.className = 'status-pill online';
      if (showAlert) alert(`구글 시트에서 총 ${ROLES_DB.length}종의 역할을 실시간으로 불러왔습니다!`);
    }
  } catch (e) {
    if (showAlert) alert('시트 연동 실패 (공유 설정이 링크가 있는 모든 사용자 뷰어인지 확인하세요): ' + e.message);
  }
}

function getRoleObj(roleId) {
  return ROLES_DB.find(r => r.id === roleId) || ROLES_DB[0];
}

function renderRoleConfigUI() {
  const box = document.getElementById('roleConfigList');
  if (!box) return;
  box.innerHTML = '';
  ROLES_DB.filter(r => !EXCLUDED_FROM_SETUP.includes(r.id)).forEach(r => {
    const div = document.createElement('div');
    div.className = 'role-cfg-item';
    div.innerHTML = `
      <span>${r.icon || '🎭'} ${r.name} <small style="color:#94a3b8">(${r.team})</small></span>
      <input type="number" id="rc_${r.id}" value="${r.count}" min="0" max="10">
    `;
    box.appendChild(div);
  });
}

function openRoleBookModal() {
  const grid = document.getElementById('roleBookGrid');
  grid.innerHTML = ROLES_DB.map(r => `
    <div class="book-item">
      <div>
        <img src="${r.img}" alt="${r.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
        <div class="book-fallback" style="display:none;">${r.icon || '🎭'}</div>
      </div>
      <div>
        <div style="font-size:11px; color:#2dd4bf; font-weight:800;">${r.team} 진영</div>
        <div style="font-size:16px; font-weight:900; margin:2px 0;">${r.name}</div>
        <div style="font-size:12px; color:#cbd5e1; line-height:1.4;">${r.desc}</div>
      </div>
    </div>
  `).join('');
  document.getElementById('roleBookModal').classList.add('show');
}
function closeRoleBookModal() { document.getElementById('roleBookModal').classList.remove('show'); }

/* =====================================================================
 * 2. 교사 PC · 전자칠판 스테이지 및 로그 기록 엔진
 * ===================================================================== */
function recordGameLog(day, phase, category, actor, detail) {
  if (!currentRoom || !db) return;
  const entry = {
    time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
    day: Number(day || 0),
    phase: String(phase || ''),
    category: String(category || ''),
    actor: String(actor || ''),
    detail: String(detail || '')
  };
  db.ref(`rooms/${currentRoom}/logs`).push(entry);
}

function enterTeacherStage() {
  if (!db || !myUid) return alert('먼저 app.js 상단에 파이어베이스 설정값을 입력해주세요.');
  isTeacher = true;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  currentRoom = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  switchView('stageView');
  document.getElementById('stRoomCode').textContent = `CODE: ${currentRoom}`;

  const joinUrl = `${location.origin}${location.pathname}?room=${currentRoom}`;
  const qrBox = document.getElementById('qrCanvas');
  qrBox.innerHTML = '';
  new QRCode(qrBox, { text: joinUrl, width: 190, height: 190 });

  const roomRef = db.ref(`rooms/${currentRoom}`);
  roomRef.set({
    hostUid: myUid,
    public: {
      phase: 'LOBBY',
      day: 0,
      winnerTitle: '',
      winnerReason: '',
      headline: '태블릿으로 QR 코드를 스캔해 입장하세요',
      announcements: ['교사가 방을 개설했습니다. 학생들이 모두 입장하면 시작 버튼을 누르세요.'],
      timerEnd: 0,
      mayorUid: '',
      activeRoleIds: []
    }
  });

  subscribeStageRoom(currentRoom);
}

function subscribeStageRoom(roomCode) {
  const roomRef = db.ref(`rooms/${roomCode}`);

  roomRef.child('public').on('value', snap => {
    roomCache.public = snap.val() || {};
    const pub = roomCache.public;

    document.getElementById('stPhaseBadge').textContent = `${pub.day || 0}일차 · ${pub.phase || 'LOBBY'}`;
    document.getElementById('stHeadline').textContent = pub.headline || '';
    document.body.classList.toggle('night-mode', pub.phase === 'NIGHT');

    const isLobby = !pub.phase || pub.phase === 'LOBBY';
    document.getElementById('stageLobbyGrid').classList.toggle('hidden', !isLobby);
    document.getElementById('stageGameGrid').classList.toggle('hidden', isLobby);
    document.getElementById('teacherControlBar').classList.toggle('hidden', isLobby);

    document.getElementById('stPublicFeed').innerHTML =
      (pub.announcements || []).map(a => `<div>• ${a}</div>`).join('');

    renderActiveRolesStrip(pub.activeRoleIds || []);
    startSharedCountdown(pub.timerEnd, 'stTimer');

    // 게임 종료 시 결과 인포그래픽 모달 자동 팝업
    if (pub.phase === 'GAME_OVER' && isTeacher) {
      setTimeout(() => openReportModal(), 700);
    }
  });

  roomRef.child('players').on('value', snap => {
    roomCache.players = snap.val() || {};
    const entries = Object.values(roomCache.players);
    document.getElementById('stJoinCount').textContent = entries.length;

    const chipsHtml = entries.map(p => `
      <div class="b-p-chip ${p.alive === false ? 'dead' : ''}">
        ${p.isMayor ? '👑 ' : ''}${p.name}
        ${p.silenced ? '<br><small style="color:#f43f5e">🤐침묵</small>' : ''}
        ${p.isMonk ? '<br><small style="color:#a855f7">📿수도승</small>' : ''}
      </div>
    `).join('');

    document.getElementById('stLobbyPlayers').innerHTML = chipsHtml;
    document.getElementById('stGamePlayers').innerHTML = chipsHtml;
    renderSecretInspectorContent();
  });

  roomRef.child('secrets').on('value', snap => {
    roomCache.secrets = snap.val() || {};
    renderSecretInspectorContent();
  });

  roomRef.child('actions').on('value', snap => {
    roomCache.actions = snap.val() || {};
    if (isTeacher) handleRealtimeActionTrigger(roomCache.actions);
    renderSecretInspectorContent();
  });

  roomRef.child('logs').on('value', snap => {
    const val = snap.val() || {};
    roomCache.logs = Object.values(val);
  });
}

function renderActiveRolesStrip(roleIds) {
  const strip = document.getElementById('stActiveRolesStrip');
  if (!strip) return;
  const uniqueIds = [...new Set(['werewolf', 'citizen', ...roleIds])];
  strip.innerHTML = uniqueIds.map(id => {
    const r = getRoleObj(id);
    return `
      <div class="strip-role-card" onclick="openRoleBookModal()">
        <img src="${r.img}" alt="${r.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
        <div class="strip-fallback" style="display:none;">${r.icon || '🎭'}</div>
        <div style="font-size:12px; font-weight:900;">${r.name}</div>
      </div>
    `;
  }).join('');
}

function openSecretInspectorModal() {
  if (roomCache.public.phase !== 'NIGHT' && roomCache.public.phase !== 'GAME_OVER') {
    if (!confirm('⚠️ 현재 낮 시간입니다! 전자칠판에 비밀장부가 뜨면 학생들이 직업을 볼 수 있습니다. 정말 여시겠습니까?')) return;
  }
  renderSecretInspectorContent();
  document.getElementById('secretInspectorModal').classList.add('show');
}
function closeSecretInspectorModal() {
  document.getElementById('secretInspectorModal').classList.remove('show');
}

function joinAsTeacherMobile() {
  if (!db || !myUid) return;
  const code = document.getElementById('joinRoomInput').value.trim().toUpperCase();
  if (!code) return alert('4자리 방 코드를 입력해주세요.');
  const pin = prompt('교사 시크릿 관제 PIN 번호를 입력하세요:');
  if (pin !== TEACHER_PIN) return alert('PIN 번호가 일치하지 않습니다.');

  currentRoom = code;
  isTeacher = false;
  switchView('stageView');
  subscribeStageRoom(code);
  document.getElementById('secretInspectorModal').classList.add('show');
}

function renderSecretInspectorContent() {
  const grid = document.getElementById('inspectorPlayerGrid');
  if (!grid) return;
  grid.innerHTML = '';

  Object.entries(roomCache.players).forEach(([uid, p]) => {
    const sec = roomCache.secrets[uid] || {};
    const isWolf = sec.team === '늑대' || sec.infected;
    const div = document.createElement('div');
    div.className = `t-p-card ${p.alive === false ? 'dead' : ''} ${isWolf ? 'wolf' : ''}`;
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-weight:900;">
        <span>${p.isMayor ? '👑 ' : ''}${p.name}</span>
        <span>${p.alive === false ? '💀사망' : (p.silenced ? '🤐침묵' : (p.isMonk ? '📿수도승' : '🟢생존'))}</span>
      </div>
      <div style="color:#2dd4bf;font-weight:800;">
        ${sec.icon || ''} ${sec.roleName || '미배정'} ${sec.variantWolf ? `(${sec.variantWolf})` : ''}
      </div>
      <div style="display:flex;gap:4px;margin-top:4px;">
        <button class="btn-sm" style="padding:2px 6px;font-size:10px;" onclick="togglePlayerAlive('${uid}')">생사전환</button>
        <button class="btn-sm" style="padding:2px 6px;font-size:10px;" onclick="togglePlayerSilence('${uid}')">침묵전환</button>
      </div>
    `;
    grid.appendChild(div);
  });

  const logBox = document.getElementById('inspectorActionLog');
  const entries = Object.entries(roomCache.actions || {});
  logBox.innerHTML = entries.length === 0
    ? '아직 제출된 밤 행동/투표가 없습니다.'
    : entries.map(([u, a]) => {
        const pName = roomCache.players[u]?.name || u;
        const tName = a.targetUid ? (roomCache.players[a.targetUid]?.name || '') : '';
        return `• <b>${pName}</b>: [${a.type}] ${tName} ${a.clue ? `("${a.clue}")` : ''}`;
      }).join('<br>');
}

function togglePlayerAlive(uid) {
  const cur = roomCache.players[uid]?.alive !== false;
  db.ref(`rooms/${currentRoom}/players/${uid}/alive`).set(!cur);
}
function togglePlayerSilence(uid) {
  const cur = !!roomCache.players[uid]?.silenced;
  db.ref(`rooms/${currentRoom}/players/${uid}/silenced`).set(!cur);
}

/* =====================================================================
 * 3. 역할 랜덤 배정 & 실시간 밤/낮 판정
 * ===================================================================== */
function startGameByTeacher() {
  const uids = Object.keys(roomCache.players);
  if (uids.length < 3) return alert('최소 3명 이상의 학생이 입장해야 시작할 수 있습니다.');

  const wolfMode = document.getElementById('optWolfMode').value;
  const useVariant = document.getElementById('optVariantWolf').checked;
  const infectProb = Number(document.getElementById('optInfectProb').value) || 50;
  const whiteWolfMode = document.getElementById('optWhiteWolfMode').value;

  let pool = [];
  const activeRoleIds = [];
  ROLES_DB.filter(r => !EXCLUDED_FROM_SETUP.includes(r.id)).forEach(r => {
    const cnt = Number(document.getElementById(`rc_${r.id}`)?.value || 0);
    if (cnt > 0) activeRoleIds.push(r.id);
    for (let i = 0; i < cnt; i++) pool.push(r);
  });

  const citizenRole = getRoleObj('citizen');
  while (pool.length < uids.length) pool.push(citizenRole);
  pool = pool.slice(0, uids.length);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const secretsUpdate = {};
  const playersUpdate = {};

  uids.forEach((uid, idx) => {
    const role = pool[idx];
    playersUpdate[uid] = {
      ...roomCache.players[uid],
      alive: true,
      silenced: false,
      isMonk: false,
      isMayor: false
    };
    secretsUpdate[uid] = {
      roleId: role.id,
      roleName: role.name,
      initialRoleName: role.name,
      team: role.team,
      skill: role.skill,
      startNight: role.startNight,
      usesLeft: role.uses,
      img: role.img || '',
      icon: role.icon || '🎭',
      desc: role.desc,
      infected: role.id === 'werewolf',
      isOriginalWolf: role.id === 'werewolf' && idx === pool.findIndex(r => r.id === 'werewolf'),
      variantWolf: '',
      instantMsg: '게임이 시작되었습니다! 내 직업 카드와 삽화를 확인하세요.'
    };
  });

  db.ref(`rooms/${currentRoom}`).update({
    players: playersUpdate,
    secrets: secretsUpdate,
    actions: null,
    logs: null,
    public: {
      phase: 'DAY_DISCUSSION',
      day: 1,
      winnerTitle: '',
      winnerReason: '',
      wolfMode,
      useVariant,
      infectProb,
      whiteWolfMode,
      infectedCount: 1,
      mayorUid: '',
      activeRoleIds,
      headline: '☀️ 1번째 낮이 밝았습니다! 첫날 시장 선거를 진행하세요.',
      announcements: ['모든 학생의 태블릿으로 비밀 직업 카드와 삽화가 전송되었습니다.'],
      timerEnd: Date.now() + 180000
    }
  });

  recordGameLog(1, 'START', '게임시작', '시스템', `총 ${uids.length}명 역할 배정 완료 (${wolfMode === 'infect' ? '감염·변이 모드' : '클래식 모드'})`);
  syncWolfTeamList(secretsUpdate);
}

function syncWolfTeamList(secretsObj) {
  const wolfNames = [];
  Object.entries(secretsObj).forEach(([u, s]) => {
    if (s.team === '늑대' || s.infected) {
      wolfNames.push(`${roomCache.players[u]?.name || u}(${s.variantWolf || s.roleName})`);
    }
  });
  Object.entries(secretsObj).forEach(([u, s]) => {
    if (s.team === '늑대' || s.infected) {
      db.ref(`rooms/${currentRoom}/secrets/${u}/wolfTeam`).set(wolfNames.join(', '));
    }
  });
}

function handleRealtimeActionTrigger(actions) {
  const aliveTotal = Object.values(roomCache.players).filter(p => p.alive !== false).length;
  const actedCount = Object.keys(actions || {}).length;
  document.getElementById('stActionCount').textContent = `제출: ${actedCount} / ${aliveTotal}`;

  Object.entries(actions || {}).forEach(([actorUid, act]) => {
    if (act.processedInstant) return;
    const actorSec = roomCache.secrets[actorUid];
    const actorName = roomCache.players[actorUid]?.name || '플레이어';
    if (!actorSec) return;

    // 1) 정체 즉시 조사
    if (act.type === 'INSPECT' && act.targetUid) {
      const targetSec = roomCache.secrets[act.targetUid];
      const targetName = roomCache.players[act.targetUid]?.name || '대상';
      let shownRole = targetSec?.roleName || '시민';
      if (actorSec.roleId === 'seer' && targetSec?.roleId === 'fraud') shownRole = '시민';

      db.ref(`rooms/${currentRoom}/secrets/${actorUid}/instantMsg`).set(
        `🔍 [즉시 조사 결과] ${targetName}님의 정체는 [${shownRole}]입니다!`
      );
      db.ref(`rooms/${currentRoom}/actions/${actorUid}/processedInstant`).set(true);
      recordGameLog(roomCache.public.day, 'NIGHT', '정체조사', `${actorName}(${actorSec.variantWolf || actorSec.roleName})`, `${targetName} 조사 ➔ [${shownRole}] 확인`);
    }

    // 2) 기술자 늑대 수 확인
    if (act.type === 'TECH_COUNT') {
      const aliveWolves = Object.entries(roomCache.secrets).filter(([u, s]) =>
        roomCache.players[u]?.alive !== false && (s.roleId === 'werewolf' || s.infected)
      ).length;
      db.ref(`rooms/${currentRoom}/secrets/${actorUid}/instantMsg`).set(
        `⚙️ [기술자 기계 탐지] 현재 살아있는 늑대는 총 [${aliveWolves}명]입니다!`
      );
      db.ref(`rooms/${currentRoom}/actions/${actorUid}/processedInstant`).set(true);
      recordGameLog(roomCache.public.day, 'NIGHT', '기계탐지', `${actorName}(기술자)`, `생존 늑대 수 ${aliveWolves}명 확인`);
    }

    // 3) 유령 ➔ 영혼술사 1글자 단서
    if (act.type === 'GHOST_CLUE' && act.clue) {
      const char1 = String(act.clue).trim().slice(0, 1);
      Object.entries(roomCache.secrets).forEach(([u, s]) => {
        if (s.roleId === 'medium' && roomCache.players[u]?.alive !== false) {
          db.ref(`rooms/${currentRoom}/secrets/${u}/instantMsg`).set(
            `🔮 [유령의 1글자 단서 도착] ${actorName}: "${char1}"`
          );
        }
      });
      db.ref(`rooms/${currentRoom}/actions/${actorUid}/processedInstant`).set(true);
      recordGameLog(roomCache.public.day, 'NIGHT', '유령단서', `${actorName}(유령)`, `영혼술사에게 1글자 단서 "${char1}" 전송`);
    }

    // 4) 사냥꾼 사망 즉시 길동무 처치
    if (act.type === 'HUNTER_REVENGE' && act.targetUid) {
      const tName = roomCache.players[act.targetUid]?.name || '대상';
      db.ref(`rooms/${currentRoom}/players/${act.targetUid}/alive`).set(false);
      pushPublicAnnouncement(`🔫 사냥꾼의 마지막 총성이 울려 [${tName}]님이 함께 처치되었습니다!`);
      db.ref(`rooms/${currentRoom}/actions/${actorUid}/processedInstant`).set(true);
      recordGameLog(roomCache.public.day, roomCache.public.phase, '사냥꾼길동무', `${actorName}(사냥꾼)`, `${tName} 동반 처치`);
      checkVictoryConditions();
    }

    // 5) 시장 동표 결선 처형
    if (act.type === 'MAYOR_DECIDE' && act.targetUid) {
      executeVotedPlayer(act.targetUid, true);
      db.ref(`rooms/${currentRoom}/actions/${actorUid}/processedInstant`).set(true);
    }
  });
}

function setGamePhase(phase) {
  closeSecretInspectorModal();
  const day = roomCache.public.day || 1;
  const headlines = {
    MAYOR_VOTE: `👑 ${day}일차 낮 - 시장(리더) 선출 투표를 진행하세요!`,
    DAY_DISCUSSION: `☀️ ${day}일차 낮 - 자유롭게 돌아다니며 의견을 나누세요!`,
    DAY_VOTE: `🗳️ ${day}일차 낮 - 처형할 용의자에게 투표하세요!`,
    NIGHT: `🌙 ${day}번째 밤이 찾아왔습니다. 모두 엎드려서 능력을 사용하세요.`
  };
  db.ref(`rooms/${currentRoom}/actions`).remove();
  db.ref(`rooms/${currentRoom}/public`).update({
    phase,
    headline: headlines[phase] || phase,
    timerEnd: Date.now() + (phase === 'DAY_DISCUSSION' ? 180000 : 60000)
  });
}

function resolveDayVote() {
  const phase = roomCache.public.phase;
  const actions = roomCache.actions || {};
  const tally = {};
  Object.values(actions).forEach(a => {
    if (a.type === 'VOTE' && a.targetUid) tally[a.targetUid] = (tally[a.targetUid] || 0) + 1;
  });

  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return pushPublicAnnouncement('⚖️ 아무도 투표하지 않아 부결되었습니다.');

  const maxVotes = sorted[0][1];
  const topCandidates = sorted.filter(x => x[1] === maxVotes).map(x => x[0]);

  if (phase === 'MAYOR_VOTE') {
    const winnerUid = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    const winnerName = roomCache.players[winnerUid]?.name || '당선자';
    db.ref(`rooms/${currentRoom}/players/${winnerUid}/isMayor`).set(true);
    db.ref(`rooms/${currentRoom}/public/mayorUid`).set(winnerUid);
    pushPublicAnnouncement(`👑 첫날 시장으로 [${winnerName}]님이 선출되었습니다!`);
    recordGameLog(roomCache.public.day, 'DAY', '시장선출', winnerName, `${maxVotes}표 획득하여 초대 시장 당선`);
    return;
  }

  const mayorUid = roomCache.public.mayorUid;
  if (topCandidates.length >= 2 && mayorUid && roomCache.players[mayorUid]?.alive !== false) {
    const names = topCandidates.map(u => roomCache.players[u]?.name).join(', ');
    pushPublicAnnouncement(`⚖️ [${names}] 동표 발생! 👑 시장님이 최종 처형 대상을 결정합니다.`);
    db.ref(`rooms/${currentRoom}/public`).update({ phase: 'MAYOR_TIEBREAK', tieCandidates: topCandidates });
    return;
  }

  executeVotedPlayer(topCandidates[Math.floor(Math.random() * topCandidates.length)], false);
}

function executeVotedPlayer(targetUid, byMayor) {
  const targetSec = roomCache.secrets[targetUid];
  const targetName = roomCache.players[targetUid]?.name || '대상';

  if (targetSec?.roleId === 'agent') {
    db.ref(`rooms/${currentRoom}/players/${targetUid}/alive`).set(false);
    recordGameLog(roomCache.public.day, 'DAY', '공작원승리', targetName, '낮 투표로 처형당해 공작원 단독 승리 달성');
    finishGameWithWinner('🕶️ 공작원 단독 승리!', `공작원 [${targetName}]님이 투표로 처형당해 즉시 승리했습니다!`);
    return;
  }

  if (targetSec?.roleId === 'fraud' && targetSec.usesLeft > 0) {
    db.ref(`rooms/${currentRoom}/secrets/${targetUid}/usesLeft`).set(0);
    const otherAlive = Object.keys(roomCache.players).filter(u => u !== targetUid && roomCache.players[u].alive !== false);
    if (otherAlive.length > 0) {
      const victimUid = otherAlive[Math.floor(Math.random() * otherAlive.length)];
      const victimName = roomCache.players[victimUid]?.name;
      db.ref(`rooms/${currentRoom}/players/${victimUid}/alive`).set(false);
      pushPublicAnnouncement(`🃏 사기꾼의 속임수 발동! [${targetName}]님 대신 [${victimName}]님이 처형되었습니다!`);
      recordGameLog(roomCache.public.day, 'DAY', '사기꾼대리처형', targetName, `${targetName}(사기꾼) 대신 ${victimName} 랜덤 처형`);
      triggerHunterIfDead(victimUid);
      checkVictoryConditions();
      return;
    }
  }

  db.ref(`rooms/${currentRoom}/players/${targetUid}/alive`).set(false);
  pushPublicAnnouncement(`⚖️ 마을 투표 결과 [${targetName}]님이 처형되었습니다.`);
  recordGameLog(roomCache.public.day, 'DAY', '투표처형', targetName, `${byMayor ? '시장 결선 지목으로' : '다수결 투표로'} 처형 (${targetSec?.roleName})`);
  triggerHunterIfDead(targetUid);
  checkVictoryConditions();
}

function triggerHunterIfDead(uid) {
  const sec = roomCache.secrets[uid];
  if (sec?.roleId === 'hunter' && sec.usesLeft > 0) {
    db.ref(`rooms/${currentRoom}/secrets/${uid}/usesLeft`).set(0);
    db.ref(`rooms/${currentRoom}/secrets/${uid}/hunterTrigger`).set(true);
    pushPublicAnnouncement(`🔫 사냥꾼 [${roomCache.players[uid]?.name}]님이 마지막 총구를 겨눕니다! (태블릿에서 대상 선택)`);
  }
}

function resolveNightToMorning() {
  closeSecretInspectorModal();

  const night = roomCache.public.day || 1;
  const actions = roomCache.actions || {};
  const players = { ...roomCache.players };
  const secrets = { ...roomCache.secrets };
  const news = [];

  Object.keys(players).forEach(u => { players[u].silenced = false; });

  const protectedSet = new Set();
  Object.entries(actions).forEach(([u, a]) => {
    const actorName = players[u]?.name || '';
    if (a.type === 'GUARD' && Array.isArray(a.targets)) {
      a.targets.forEach(t => protectedSet.add(t));
      recordGameLog(night, 'NIGHT', '경비병호위', actorName, `${a.targets.map(t => players[t]?.name).join(', ')} 호위`);
    }
    if (a.type === 'WIZARD_PROTECT' && a.targetUid) {
      protectedSet.add(a.targetUid);
      recordGameLog(night, 'NIGHT', '마법사보호', actorName, `${players[a.targetUid]?.name} 보호 마법`);
    }
  });
  Object.entries(secrets).forEach(([u, s]) => {
    if (s.roleId === 'priest' && night <= 3) protectedSet.add(u);
  });

  const killedTonight = new Set();
  const wolfVotes = {};
  let infectTargets = [];
  let infectActorUid = null;

  Object.entries(actions).forEach(([u, a]) => {
    if (a.type === 'WOLF_KILL' && a.targetUid) wolfVotes[a.targetUid] = (wolfVotes[a.targetUid] || 0) + 1;
    if (a.type === 'WOLF_INFECT' && Array.isArray(a.targets)) {
      infectTargets = a.targets;
      infectActorUid = u;
    }
  });

  if (infectTargets.length > 0 && infectActorUid) {
    const actorSec = secrets[infectActorUid];
    const prob = actorSec.isOriginalWolf ? 100 : (roomCache.public.infectProb ?? 50);

    infectTargets.forEach(tUid => {
      const tName = players[tUid]?.name || '';
      if ((roomCache.public.infectedCount || 1) >= 6 || protectedSet.has(tUid)) {
        recordGameLog(night, 'NIGHT', '감염방어됨', tName, '호위/무적 또는 최대 인원 초과로 감염 실패');
        return;
      }
      if (Math.random() * 100 <= prob) {
        secrets[tUid].infected = true;
        const order = roomCache.public.infectedCount || 1;
        roomCache.public.infectedCount = order + 1;
        if (roomCache.public.useVariant) {
          if (order === 1) { secrets[tUid].variantWolf = '탐정 늑대'; secrets[tUid].img = getRoleObj('wolf_detective').img; }
          else if (order === 2) { secrets[tUid].variantWolf = '약사 늑대'; secrets[tUid].img = getRoleObj('wolf_chemist').img; }
          else if (order === 3) { secrets[tUid].variantWolf = '부두술사 늑대'; secrets[tUid].img = getRoleObj('wolf_witch').img; }
        }
        secrets[tUid].instantMsg = `🐺 당신은 늑대에게 감염되었습니다! ${secrets[tUid].variantWolf ? `[${secrets[tUid].variantWolf}] 능력을 얻었습니다.` : ''}`;
        recordGameLog(night, 'NIGHT', '늑대감염성공', tName, `${order}번째 감염 (${secrets[tUid].variantWolf || '늑대 진영'})`);
      } else {
        recordGameLog(night, 'NIGHT', '늑대감염실패', tName, `확률(${prob}%) 판정 실패`);
      }
    });
  } else {
    const sortedWolf = Object.entries(wolfVotes).sort((a, b) => b[1] - a[1]);
    if (sortedWolf.length > 0) {
      const top = sortedWolf.filter(x => x[1] === sortedWolf[0][1]).map(x => x[0]);
      const victim = top[Math.floor(Math.random() * top.length)];
      if (!protectedSet.has(victim)) {
        killedTonight.add(victim);
        recordGameLog(night, 'NIGHT', '늑대습격', players[victim]?.name, '늑대 다수결 습격으로 사망');
      } else {
        recordGameLog(night, 'NIGHT', '습격방어성공', players[victim]?.name, '보호/무적으로 늑대 습격 방어');
      }
    }
  }

  const chemistAlive = Object.entries(secrets).some(([u, s]) => s.variantWolf === '약사 늑대' && players[u]?.alive !== false);
  Object.entries(actions).forEach(([u, a]) => {
    const actorName = players[u]?.name || '';
    if (a.type === 'WIZARD_POISON' && a.targetUid) {
      const tName = players[a.targetUid]?.name || '';
      if (protectedSet.has(a.targetUid)) {
        recordGameLog(night, 'NIGHT', '독마법방어', actorName, `${tName} 대상 독 마법이 호위에 막힘`);
      } else {
        const isTargetWolf = secrets[a.targetUid]?.roleId === 'werewolf' || secrets[a.targetUid]?.infected;
        if (isTargetWolf && chemistAlive) {
          recordGameLog(night, 'NIGHT', '약사독면역', actorName, `${tName} 대상 독 마법이 약사 늑대 패시브로 무효화`);
        } else {
          killedTonight.add(a.targetUid);
          recordGameLog(night, 'NIGHT', '마법사독살', actorName, `${tName} 독 마법 처치`);
        }
      }
    }
    if (a.type === 'WHITE_WOLF_KILL' && a.targetUid) {
      if (!protectedSet.has(a.targetUid)) {
        killedTonight.add(a.targetUid);
        recordGameLog(night, 'NIGHT', '하얀늑대처치', actorName, `${players[a.targetUid]?.name} 처치`);
      }
    }
    if (a.type === 'ASSASSINATE' && a.targetUid) {
      const tName = players[a.targetUid]?.name || '';
      if (!protectedSet.has(a.targetUid)) killedTonight.add(a.targetUid);
      if (secrets[a.targetUid]?.roleId !== 'meteorologist') {
        secrets[u].lockedNextNight = true;
        secrets[u].instantMsg = '⚠️ 기상학자가 아닌 사람을 암살하여 다음 밤 행동할 수 없습니다!';
        recordGameLog(night, 'NIGHT', '암살실패페널티', actorName, `${tName} 암살 (기상학자 아님 ➔ 다음 밤 행동 봉인)`);
      } else {
        secrets[u].assassinatedTarget = true;
        secrets[u].instantMsg = '🗡️ 기상학자 암살 성공! 최후까지 생존하면 승리합니다.';
        recordGameLog(night, 'NIGHT', '기상학자암살성공', actorName, `표적 ${tName}(기상학자) 암살 달성!`);
      }
    }
    if (a.type === 'TORNADO' && (secrets[u]?.usesLeft || 0) > 0) {
      secrets[u].usesLeft--;
      const candidates = Object.keys(players).filter(pUid => pUid !== u && players[pUid].alive !== false);
      const cutCount = Math.floor((candidates.length + 1) * 0.3);
      const swept = candidates.sort(() => Math.random() - 0.5).slice(0, cutCount);
      swept.forEach(sUid => killedTonight.add(sUid));
      news.push(`🌪️ 기상학자의 토네이도가 마을을 덮쳐 ${swept.length}명이 휩쓸렸습니다!`);
      recordGameLog(night, 'NIGHT', '토네이도발동', actorName, `${swept.map(s => players[s]?.name).join(', ')} (${swept.length}명) 휩쓸림`);
    }
    if (a.type === 'PRIEST_REVIVE' && a.reviveUid && a.sacrificeUid && (secrets[u]?.usesLeft || 0) > 0) {
      if (!killedTonight.has(a.sacrificeUid) && players[a.sacrificeUid]?.alive !== false) {
        secrets[u].usesLeft--;
        killedTonight.add(a.sacrificeUid);
        players[a.reviveUid].alive = true;
        players[a.reviveUid].isMonk = true;
        const monkRole = getRoleObj('monk');
        secrets[a.reviveUid].roleName = '수도승';
        secrets[a.reviveUid].img = monkRole.img;
        secrets[a.reviveUid].icon = monkRole.icon;
        secrets[a.reviveUid].desc = monkRole.desc;
        news.push(`🙏 성직자의 주술로 [${players[a.reviveUid].name}]님이 [수도승]으로 부활했습니다!`);
        recordGameLog(night, 'NIGHT', '성직자부활주술', actorName, `${players[a.sacrificeUid].name} 희생 ➔ ${players[a.reviveUid].name} 수도승 부활`);
      }
    }
    if (a.type === 'SILENCE' && a.targetUid && players[a.targetUid]?.alive !== false) {
      players[a.targetUid].silenced = true;
      news.push(`🤡 광대의 마법으로 오늘 낮 동안 [${players[a.targetUid].name}]님은 침묵 상태입니다!`);
      recordGameLog(night, 'NIGHT', '광대침묵', actorName, `${players[a.targetUid].name} 침묵 지정`);
    }
  });

  killedTonight.forEach(uid => {
    if (players[uid]) {
      players[uid].alive = false;
      news.push(`💀 간밤에 [${players[uid].name}]님이 처치당했습니다.`);
      triggerHunterIfDead(uid);
    }
  });

  if (news.length === 0) news.push('🌅 간밤에는 아무도 사망하지 않고 평화롭게 아침이 밝았습니다.');

  const nextDay = night + 1;
  db.ref(`rooms/${currentRoom}`).update({
    players,
    secrets,
    actions: null,
    public: {
      ...roomCache.public,
      day: nextDay,
      phase: 'DAY_DISCUSSION',
      headline: `☀️ ${nextDay}번째 아침이 밝았습니다!`,
      announcements: news,
      timerEnd: Date.now() + 180000
    }
  });

  syncWolfTeamList(secrets);
  checkVictoryConditions(players, secrets, nextDay);
}

function checkVictoryConditions(playersObj = roomCache.players, secretsObj = roomCache.secrets, dayNum = roomCache.public.day) {
  const aliveUids = Object.keys(playersObj).filter(u => playersObj[u].alive !== false);
  const wolves = aliveUids.filter(u => {
    const s = secretsObj[u];
    return (s?.roleId === 'werewolf' || s?.infected) && s?.roleId !== 'white_wolf';
  });
  const citizens = aliveUids.filter(u => !wolves.includes(u));

  if (aliveUids.length === 1 && secretsObj[aliveUids[0]]?.roleId === 'meteorologist') {
    return finishGameWithWinner('🌪️ 기상학자 단독 승리!', '모두를 아웃시키고 기상학자 혼자 생존했습니다!');
  }
  const assassinUid = aliveUids.find(u => secretsObj[u]?.roleId === 'assassin' && secretsObj[u]?.assassinatedTarget);
  if (assassinUid && wolves.length === 0) {
    return finishGameWithWinner('🗡️ 암살자 승리!', '기상학자를 암살하고 끝까지 생존했습니다!');
  }
  const whiteWolfAlive = aliveUids.find(u => secretsObj[u]?.roleId === 'white_wolf');
  if (wolves.length === 0 && whiteWolfAlive && citizens.length <= 6) {
    return finishGameWithWinner('🐺🤍 하얀 늑대 단독 승리!', '일반 늑대를 모두 처치하고 시민 5명 이하와 생존했습니다!');
  }
  if (wolves.length === 0) {
    return finishGameWithWinner('🎉 시민 진영 승리!', '모든 늑대인간을 처치하여 시민이 승리했습니다!');
  }
  if (wolves.length >= citizens.length * 0.5) {
    return finishGameWithWinner('🐺 늑대인간 진영 승리!', `늑대 수(${wolves.length}명)가 시민 수(${citizens.length}명)의 절반 이상이 되었습니다!`);
  }
  if (dayNum >= 10 && wolves.length >= citizens.length * 0.3) {
    return finishGameWithWinner('🐺 늑대인간 진영 승리!', '10번째 밤에 늑대가 시민의 30% 이상 생존하여 승리했습니다!');
  }
}

function finishGameWithWinner(title, reason) {
  recordGameLog(roomCache.public.day, 'END', '게임종료', title, reason);
  db.ref(`rooms/${currentRoom}/public`).update({
    phase: 'GAME_OVER',
    winnerTitle: title,
    winnerReason: reason,
    headline: `${title} — ${reason}`,
    announcements: [title, reason]
  });
}

function pushPublicAnnouncement(msg) {
  const list = roomCache.public.announcements || [];
  list.unshift(msg);
  db.ref(`rooms/${currentRoom}/public/announcements`).set(list.slice(0, 6));
}

function destroyRoom() {
  if (!confirm('방을 폭파하기 전에 [📊 결과 인포그래픽/시트 저장]을 완료하셨나요?\n확인을 누르면 서버에서 데이터가 즉시 영구 삭제됩니다.')) return;
  db.ref(`rooms/${currentRoom}`).remove().then(() => {
    firebase.database().goOffline();
    location.href = location.pathname;
  });
}

function startSharedCountdown(timerEnd, elemId) {
  clearInterval(timerInterval);
  const el = document.getElementById(elemId);
  if (!timerEnd) { el.textContent = '--:--'; return; }
  timerInterval = setInterval(() => {
    const rem = Math.max(0, Math.floor((timerEnd - Date.now()) / 1000));
    el.textContent = `${String(Math.floor(rem / 60)).padStart(2, '0')}:${String(rem % 60).padStart(2, '0')}`;
  }, 500);
}

/* =====================================================================
 * 4. 게임 결과 인포그래픽 포스터(.png) & 스프레드시트(.csv) 생성기
 * ===================================================================== */
function openReportModal() {
  drawInfographicPoster();
  document.getElementById('reportModal').classList.add('show');
}
function closeReportModal() {
  document.getElementById('reportModal').classList.remove('show');
}

function drawInfographicPoster() {
  const canvas = document.getElementById('infographicCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const pEntries = Object.entries(roomCache.players || {});
  const logs = roomCache.logs || [];
  const rowsNeeded = Math.ceil(Math.max(pEntries.length, 1) / 5);
  const logLines = Math.min(logs.length, 18);
  canvas.width = 1200;
  canvas.height = Math.max(820, 310 + rowsNeeded * 86 + logLines * 28 + 80);

  // 배경 그라데이션
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#090d14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 상단 헤더 카드
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(40, 35, 1120, 130);
  ctx.strokeStyle = '#2dd4bf';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 35, 1120, 130);

  ctx.fillStyle = '#2dd4bf';
  ctx.font = 'bold 16px Pretendard, sans-serif';
  ctx.fillText(`WEREWOLF CLASSROOM REPORT · ROOM ${currentRoom || '----'} · ${new Date().toLocaleDateString('ko-KR')}`, 65, 70);

  const winTitle = roomCache.public?.winnerTitle || `진행 중 (${roomCache.public?.day || 1}일차)`;
  const winReason = roomCache.public?.winnerReason || '교실 추리 게임 어그로우 플레이 리포트';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 34px Pretendard, sans-serif';
  ctx.fillText(winTitle, 65, 115);

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 18px Pretendard, sans-serif';
  ctx.fillText(winReason, 65, 148);

  // 섹션 1: 참가 학생 전체 정체 및 최종 생존 현황
  ctx.fillStyle = '#2dd4bf';
  ctx.font = '900 20px Pretendard, sans-serif';
  ctx.fillText(`👥 참가 학생 최종 정체 & 생존 결과 (${pEntries.length}명)`, 40, 205);

  const cardW = 212;
  const cardH = 74;
  pEntries.forEach(([uid, p], idx) => {
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    const x = 40 + col * (cardW + 15);
    const y = 222 + row * (cardH + 12);
    const sec = roomCache.secrets[uid] || {};
    const isWolf = sec.team === '늑대' || sec.infected;

    ctx.fillStyle = p.alive === false ? '#161b26' : '#1e293b';
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = isWolf ? '#f43f5e' : (p.alive === false ? '#475569' : '#2dd4bf');
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardW, cardH);

    ctx.fillStyle = p.alive === false ? '#94a3b8' : '#ffffff';
    ctx.font = 'bold 16px Pretendard, sans-serif';
    ctx.fillText(`${p.isMayor ? '👑' : ''}${p.name} (${p.alive === false ? '사망' : '생존'})`, x + 12, y + 28);

    ctx.fillStyle = isWolf ? '#fda4af' : '#5eead4';
    ctx.font = 'bold 14px Pretendard, sans-serif';
    const roleLabel = `${sec.icon || ''} ${sec.initialRoleName || sec.roleName || '시민'}${sec.variantWolf ? ` ➔ ${sec.variantWolf}` : (sec.infected && sec.roleId !== 'werewolf' ? ' (감염)' : '')}`;
    ctx.fillText(roleLabel, x + 12, y + 54);
  });

  // 섹션 2: 핵심 밤 행동 및 사건 타임라인
  const timelineStartY = 245 + rowsNeeded * 86;
  ctx.fillStyle = '#f59e0b';
  ctx.font = '900 20px Pretendard, sans-serif';
  ctx.fillText('📜 시간순 핵심 사건 & 밤 행동 연대기 (최근 18건)', 40, timelineStartY);

  const recentLogs = logs.slice(-18);
  recentLogs.forEach((lg, i) => {
    const ly = timelineStartY + 32 + i * 26;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px Pretendard, sans-serif';
    const line = `[${lg.day}일차/${lg.phase}] [${lg.category}] ${lg.actor} — ${lg.detail}`;
    ctx.fillText(line.slice(0, 95), 50, ly);
  });
}

function downloadInfographicPNG() {
  drawInfographicPoster();
  const canvas = document.getElementById('infographicCanvas');
  const link = document.createElement('a');
  link.download = `어그로우_인포그래픽_${currentRoom || 'RESULT'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function buildSpreadsheetRows() {
  const rows = [];
  rows.push(['[어그로우 게임 결과 요약]', `방 코드: ${currentRoom}`, `승리 결과: ${roomCache.public?.winnerTitle || '진행중'}`, roomCache.public?.winnerReason || '']);
  rows.push([]);
  rows.push(['번호', '학생이름', '초기직업', '소속진영', '늑대감염여부', '변이늑대직업', '시장여부', '최종생사']);

  Object.entries(roomCache.players || {}).forEach(([uid, p], idx) => {
    const s = roomCache.secrets[uid] || {};
    rows.push([
      idx + 1,
      p.name,
      s.initialRoleName || s.roleName || '',
      s.team || '',
      s.infected ? 'O' : 'X',
      s.variantWolf || '-',
      p.isMayor ? '시장' : '-',
      p.alive === false ? '사망' : '생존'
    ]);
  });

  rows.push([]);
  rows.push(['[시간순 전체 행동 및 사건 로그]']);
  rows.push(['시간', '일차', '낮/밤', '구분', '행동주체', '상세내역']);
  (roomCache.logs || []).forEach(lg => {
    rows.push([lg.time, `${lg.day}일차`, lg.phase, lg.category, lg.actor, lg.detail]);
  });
  return rows;
}

function downloadLogsCSV() {
  const rows = buildSpreadsheetRows();
  const csvContent = '\uFEFF' + rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `어그로우_게임로그_${currentRoom || 'LOG'}.csv`;
  link.click();
}

function copyLogsToClipboard() {
  const rows = buildSpreadsheetRows();
  const tsv = rows.map(r => r.join('\t')).join('\n');
  navigator.clipboard.writeText(tsv).then(() => {
    alert('클립보드에 복사되었습니다! 빈 구글 스프레드시트를 열고 Ctrl+V를 누르면 표로 깔끔하게 붙여넣어집니다.');
  });
}

/* =====================================================================
 * 5. 학생 태블릿 접속 & 낮 투표 / 밤 능력 UI
 * ===================================================================== */
function joinAsStudent() {
  if (!db || !myUid) return alert('서버 연결 대기 중입니다. 잠시 후 다시 눌러주세요.');
  const code = document.getElementById('joinRoomInput').value.trim().toUpperCase();
  const name = document.getElementById('joinNameInput').value.trim();
  if (!code || !name) return alert('방 코드와 학번 이름을 모두 입력해주세요.');

  currentRoom = code;
  document.getElementById('sNameBadge').textContent = name;
  switchView('studentView');

  db.ref(`rooms/${code}/players/${myUid}`).set({
    name, alive: true, silenced: false, isMonk: false, isMayor: false
  });

  db.ref(`rooms/${code}/public`).on('value', snap => {
    roomCache.public = snap.val() || {};
    document.body.classList.toggle('night-mode', roomCache.public.phase === 'NIGHT');
    renderStudentActionArea();
    if (roomCache.public.phase === 'GAME_OVER') {
      setTimeout(() => { if (db) firebase.database().goOffline(); }, 5 * 60 * 1000);
    }
  });

  db.ref(`rooms/${code}/players`).on('value', snap => {
    roomCache.players = snap.val() || {};
    renderStudentStatusBanner();
    renderStudentActionArea();
  });

  db.ref(`rooms/${code}/secrets/${myUid}`).on('value', snap => {
    mySecret = snap.val();
    if (!mySecret) return;

    document.getElementById('sTeamBadge').textContent = `${mySecret.team} 진영`;
    document.getElementById('sRoleName').textContent =
      `${mySecret.roleName} ${mySecret.variantWolf ? `(${mySecret.variantWolf})` : ''}`;
    document.getElementById('sRoleDesc').textContent = mySecret.desc || '';
    document.getElementById('sInfectBadge').classList.toggle('hidden', !mySecret.infected);

    const imgEl = document.getElementById('sRoleImg');
    const iconEl = document.getElementById('sRoleFallbackIcon');
    iconEl.textContent = mySecret.icon || '🎭';
    if (mySecret.img) {
      imgEl.src = mySecret.img;
      imgEl.classList.remove('hidden');
      iconEl.classList.add('hidden');
    } else {
      imgEl.classList.add('hidden');
      iconEl.classList.remove('hidden');
    }

    const mateBox = document.getElementById('sWolfTeammates');
    if (mySecret.wolfTeam) {
      mateBox.classList.remove('hidden');
      mateBox.textContent = `🐺 동료 늑대: ${mySecret.wolfTeam}`;
    } else {
      mateBox.classList.add('hidden');
    }

    const resBox = document.getElementById('sInstantResultBox');
    if (mySecret.instantMsg) {
      resBox.classList.remove('hidden');
      resBox.textContent = mySecret.instantMsg;
    }
    renderStudentActionArea();
  });
}

function toggleRoleCard() {
  document.getElementById('sRoleCard').classList.toggle('hidden');
}

function renderStudentStatusBanner() {
  const me = roomCache.players[myUid];
  if (!me) return;
  const aliveBadge = document.getElementById('sAliveBadge');
  const alertBox = document.getElementById('sStatusAlert');

  if (me.alive === false) {
    aliveBadge.textContent = '💀 유령(사망)';
    aliveBadge.className = 'status-pill offline';
    alertBox.classList.remove('hidden');
    alertBox.textContent = '💀 유령 상태입니다. 낮에는 엎드려 있고 아무 소리도 낼 수 없습니다.';
  } else if (me.isMonk) {
    aliveBadge.textContent = '📿 수도승';
    alertBox.classList.remove('hidden');
    alertBox.textContent = '📿 부활한 [수도승]입니다. 말·제스처·자리 이동이 모두 금지됩니다!';
  } else if (me.silenced) {
    aliveBadge.textContent = '🤐 침묵';
    alertBox.classList.remove('hidden');
    alertBox.textContent = '🤐 광대의 마법으로 오늘 낮 동안 아무 말도 할 수 없습니다!';
  } else {
    aliveBadge.textContent = me.isMayor ? '👑 시장(생존)' : '🟢 생존';
    aliveBadge.className = 'status-pill online';
    alertBox.classList.add('hidden');
  }
}

function renderStudentActionArea() {
  const pub = roomCache.public || {};
  const me = roomCache.players[myUid] || {};
  const titleEl = document.getElementById('sActionTitle');
  const subEl = document.getElementById('sActionSub');
  const subBar = document.getElementById('sSubModeBar');
  const grid = document.getElementById('sTargetGrid');
  const ghostBox = document.getElementById('sGhostClueBox');

  subBar.classList.add('hidden');
  subBar.innerHTML = '';
  ghostBox.classList.add('hidden');
  grid.innerHTML = '';

  if (mySecret?.hunterTrigger) {
    titleEl.textContent = '🔫 사냥꾼의 마지막 일격!';
    subEl.textContent = '같이 처치당할 플레이어 1명을 즉시 선택하세요.';
    renderTargetButtons(u => u !== myUid && roomCache.players[u].alive !== false, targetUid => {
      db.ref(`rooms/${currentRoom}/secrets/${myUid}/hunterTrigger`).set(false);
      submitStudentAction({ type: 'HUNTER_REVENGE', targetUid });
    });
    return;
  }

  if (me.alive === false) {
    titleEl.textContent = '👻 유령 모드';
    if (pub.phase === 'NIGHT') {
      subEl.textContent = '밤 시간입니다. 영혼술사에게 1글자 단서를 보낼 수 있습니다.';
      ghostBox.classList.remove('hidden');
    } else {
      subEl.textContent = '낮에는 책상에 엎드려 계세요.';
    }
    return;
  }

  if (pub.phase === 'MAYOR_TIEBREAK') {
    if (me.isMayor) {
      titleEl.textContent = '👑 시장 동표 처형 결정권';
      subEl.textContent = '동표 후보 중 최종 처형할 1명을 선택하세요.';
      const cands = pub.tieCandidates || [];
      renderTargetButtons(u => cands.includes(u), targetUid => submitStudentAction({ type: 'MAYOR_DECIDE', targetUid }));
    } else {
      titleEl.textContent = '⚖️ 시장님이 처형 대상을 고르고 있습니다...';
      subEl.textContent = '잠시만 기다려주세요.';
    }
    return;
  }

  if (pub.phase === 'MAYOR_VOTE' || pub.phase === 'DAY_VOTE') {
    titleEl.textContent = pub.phase === 'MAYOR_VOTE' ? '👑 1일차 시장 선거 투표' : '🗳️ 낮 처형 투표';
    subEl.textContent = '플레이어 이름을 터치해 투표하세요.';
    renderTargetButtons(u => roomCache.players[u].alive !== false, targetUid => submitStudentAction({ type: 'VOTE', targetUid }));
    return;
  }

  if (pub.phase === 'NIGHT') {
    if (!mySecret) return;
    const night = pub.day || 1;

    if (mySecret.lockedNextNight) {
      titleEl.textContent = '⛔ 오늘 밤 행동 불가';
      subEl.textContent = '지난 밤 기상학자가 아닌 사람을 암살하여 행동할 수 없습니다.';
      return;
    }
    if (night < (mySecret.startNight || 0)) {
      titleEl.textContent = `🌙 능력 준비 중 (${mySecret.startNight}번째 밤부터 가능)`;
      subEl.textContent = '정체가 들키지 않게 아래 완료 버튼을 눌러주세요.';
      return renderDummySleepButton();
    }

    if (mySecret.roleId === 'technician') {
      titleEl.textContent = '⚙️ 기술자 늑대 탐지기';
      subEl.textContent = '버튼을 누르면 즉시 남은 늑대 수가 표시됩니다.';
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = '📡 남은 늑대 수 즉시 확인';
      btn.onclick = () => submitStudentAction({ type: 'TECH_COUNT' });
      grid.appendChild(btn);
      return;
    }

    if (mySecret.roleId === 'meteorologist') {
      titleEl.textContent = `🌪️ 토네이도 생성기 (남은 횟수: ${mySecret.usesLeft}회)`;
      subEl.textContent = '작동 시 생존자의 30%가 무작위로 처치됩니다.';
      const btn = document.createElement('button');
      btn.className = 'btn btn-accent';
      btn.textContent = '🌪️ 오늘 밤 토네이도 발동';
      btn.onclick = () => submitStudentAction({ type: 'TORNADO' });
      grid.appendChild(btn);
      return;
    }

    if (mySecret.roleId === 'seer' || mySecret.variantWolf === '탐정 늑대') {
      titleEl.textContent = '🔍 정체 즉시 조사';
      subEl.textContent = '클릭 즉시 이 화면에 상대의 직업이 표시됩니다.';
      renderTargetButtons(u => u !== myUid && roomCache.players[u].alive !== false, targetUid => submitStudentAction({ type: 'INSPECT', targetUid }));
      return;
    }

    if (mySecret.roleId === 'wizard') {
      titleEl.textContent = '🧙‍♂️ 마법사 밤 마법';
      subEl.textContent = '보호 마법 또는 독 마법 중 하나를 선택해 대상을 클릭하세요.';
      subBar.classList.remove('hidden');
      subBar.innerHTML = `
        <button class="btn-sm" onclick="selectedSubMode='WIZARD_PROTECT';renderStudentActionArea()">🛡️ 보호 마법</button>
        <button class="btn-sm" onclick="selectedSubMode='WIZARD_POISON';renderStudentActionArea()">☠️ 독 마법</button>
      `;
      const mode = selectedSubMode.startsWith('WIZARD') ? selectedSubMode : 'WIZARD_PROTECT';
      renderTargetButtons(u => roomCache.players[u].alive !== false, targetUid => submitStudentAction({ type: mode, targetUid }));
      return;
    }

    if (mySecret.roleId === 'guard') {
      titleEl.textContent = '🛡️ 경비병 호위 (최대 2명)';
      subEl.textContent = '보호할 플레이어를 최대 2명 클릭하세요.';
      renderMultiTargetButtons(2, targets => submitStudentAction({ type: 'GUARD', targets }));
      return;
    }

    if (mySecret.roleId === 'priest' && mySecret.usesLeft > 0) {
      titleEl.textContent = '🙏 성직자 부활 의식 (1회)';
      subEl.textContent = '부활시킬 사망자 1명과 희생시킬 생존자 1명을 순서대로 선택하세요.';
      return renderPriestReviveUI();
    }

    if (mySecret.roleId === 'jester') {
      titleEl.textContent = '🤡 광대 침묵 마법';
      subEl.textContent = '내일 아침 말을 못 하게 할 1명을 선택하세요.';
      renderTargetButtons(u => u !== myUid && roomCache.players[u].alive !== false, targetUid => submitStudentAction({ type: 'SILENCE', targetUid }));
      return;
    }

    if (mySecret.roleId === 'assassin') {
      titleEl.textContent = '🗡️ 암살자 타겟 지목';
      subEl.textContent = '기상학자로 의심되는 1명을 선택하세요.';
      renderTargetButtons(u => u !== myUid && roomCache.players[u].alive !== false, targetUid => submitStudentAction({ type: 'ASSASSINATE', targetUid }));
      return;
    }

    if (mySecret.roleId === 'white_wolf') {
      titleEl.textContent = '🐺🤍 하얀 늑대 행동';
      subBar.classList.remove('hidden');
      subBar.innerHTML = `
        <button class="btn-sm" onclick="selectedSubMode='INSPECT';renderStudentActionArea()">🔍 정체 조사</button>
        <button class="btn-sm" onclick="selectedSubMode='WHITE_WOLF_KILL';renderStudentActionArea()">🩸 대상 처치</button>
      `;
      const m = selectedSubMode === 'INSPECT' ? 'INSPECT' : 'WHITE_WOLF_KILL';
      renderTargetButtons(u => u !== myUid && roomCache.players[u].alive !== false, targetUid => submitStudentAction({ type: m, targetUid }));
      return;
    }

    if (mySecret.roleId === 'werewolf' || mySecret.infected) {
      titleEl.textContent = '🐺 늑대인간 습격 / 감염';
      const witchAlive = Object.entries(roomCache.secrets || {}).some(([u, s]) => s.variantWolf === '부두술사 늑대' && roomCache.players[u]?.alive !== false);
      const maxInfect = witchAlive ? 2 : 1;

      if (pub.wolfMode === 'infect') {
        subBar.classList.remove('hidden');
        subBar.innerHTML = `
          <button class="btn-sm" onclick="selectedSubMode='WOLF_KILL';renderStudentActionArea()">🩸 시민 처치</button>
          <button class="btn-sm" onclick="selectedSubMode='WOLF_INFECT';renderStudentActionArea()">🦠 시민 감염(${maxInfect}명)</button>
        `;
      }
      if (selectedSubMode === 'WOLF_INFECT' && pub.wolfMode === 'infect') {
        subEl.textContent = `감염시킬 시민을 ${maxInfect}명 선택하세요.`;
        renderMultiTargetButtons(maxInfect, targets => submitStudentAction({ type: 'WOLF_INFECT', targets }));
      } else {
        subEl.textContent = '습격할 시민을 선택하세요 (다수결 반영).';
        renderTargetButtons(u => roomCache.players[u].alive !== false, targetUid => submitStudentAction({ type: 'WOLF_KILL', targetUid }));
      }
      return;
    }

    titleEl.textContent = '🌙 조용히 밤을 보내는 중';
    subEl.textContent = '정체가 들키지 않게 아래 완료 버튼을 터치하세요.';
    return renderDummySleepButton();
  }

  titleEl.textContent = '☀️ 낮 자유 토론 시간';
  subEl.textContent = '태블릿을 들고 돌아다니며 의견을 나누세요!';
}

function renderTargetButtons(filterFn, onSelect) {
  const grid = document.getElementById('sTargetGrid');
  grid.innerHTML = '';
  Object.entries(roomCache.players).forEach(([uid, p]) => {
    if (!filterFn(uid)) return;
    const btn = document.createElement('button');
    btn.className = 'target-btn';
    btn.textContent = p.name;
    btn.onclick = () => {
      grid.querySelectorAll('.target-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      onSelect(uid);
    };
    grid.appendChild(btn);
  });
}

function renderMultiTargetButtons(maxCount, onChange) {
  const grid = document.getElementById('sTargetGrid');
  grid.innerHTML = '';
  multiTargets = [];
  Object.entries(roomCache.players).forEach(([uid, p]) => {
    if (p.alive === false) return;
    const btn = document.createElement('button');
    btn.className = 'target-btn';
    btn.textContent = p.name;
    btn.onclick = () => {
      if (multiTargets.includes(uid)) {
        multiTargets = multiTargets.filter(x => x !== uid);
        btn.classList.remove('selected');
      } else if (multiTargets.length < maxCount) {
        multiTargets.push(uid);
        btn.classList.add('selected');
      }
      onChange(multiTargets);
    };
    grid.appendChild(btn);
  });
}

function renderPriestReviveUI() {
  const grid = document.getElementById('sTargetGrid');
  grid.innerHTML = '';
  const deadList = Object.entries(roomCache.players).filter(([u, p]) => p.alive === false);
  if (deadList.length === 0) {
    grid.innerHTML = '<p style="color:#94a3b8;font-size:13px;">부활시킬 사망자가 없습니다.</p>';
    return;
  }
  deadList.forEach(([u, p]) => {
    const btn = document.createElement('button');
    btn.className = 'target-btn';
    btn.textContent = `💀부활: ${p.name}`;
    btn.onclick = () => {
      alert(`부활 대상으로 [${p.name}]님을 선택했습니다. 이제 희생시킬 생존자를 선택하세요!`);
      renderTargetButtons(uid => uid !== myUid && roomCache.players[uid].alive !== false, sacUid => {
        submitStudentAction({ type: 'PRIEST_REVIVE', reviveUid: u, sacrificeUid: sacUid });
      });
    };
    grid.appendChild(btn);
  });
}

function renderDummySleepButton() {
  const grid = document.getElementById('sTargetGrid');
  const btn = document.createElement('button');
  btn.className = 'target-btn';
  btn.textContent = '🌙 잠들기 (밤 행동 완료)';
  btn.onclick = () => {
    btn.classList.add('selected');
    submitStudentAction({ type: 'SLEEP' });
  };
  grid.appendChild(btn);
}

function sendGhostClue() {
  const val = document.getElementById('ghostClueInput').value.trim().slice(0, 1);
  if (!val) return alert('1글자를 입력해주세요!');
  submitStudentAction({ type: 'GHOST_CLUE', clue: val });
  alert(`영혼술사에게 "${val}" 1글자 단서를 전송했습니다!`);
}

function submitStudentAction(payload) {
  if (!currentRoom || !myUid) return;
  db.ref(`rooms/${currentRoom}/actions/${myUid}`).set({ ...payload, timestamp: Date.now() });
}
