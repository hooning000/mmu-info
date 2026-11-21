// 학교 사이트에서 승선생활관 식단과 승선사관부 공지를 읽어 data/*.json 으로 저장한다.
// 실행: npm run update   (Node 18+ 필요, 외부 패키지 없음)
const fs = require("fs");
const path = require("path");

const BASE = "https://www.mmu.ac.kr";
const DATA = path.join(__dirname, "..", "data");

// 학교 서버가 비표준 HTTP 헤더를 보내서 fetch는 막힘 → 느슨한 파서(insecureHTTPParser)로 https 요청
const https = require("https");
function getHtml(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0 (personal study app)" }, insecureHTTPParser: true, timeout: 20000 },
      (res) => {
        if (res.statusCode !== 200) { res.resume(); return reject(new Error(`${url} -> HTTP ${res.statusCode}`)); }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      }
    );
    req.on("timeout", () => req.destroy(new Error("시간 초과")));
    req.on("error", reject);
  });
}

const clean = (s) =>
  s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
   .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
   .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)) // &#039; 같은 숫자 코드
   .replace(/[ \t]+/g, " ").trim();

// 게시판 목록: 제목, 날짜, 링크, 상단공지 여부
async function board(id) {
  const html = await getHtml(`${BASE}/main/board/${id}`);
  const body = html.slice(html.indexOf("<tbody"));
  const rows = body.slice(0, body.indexOf("</tbody>")).split("</tr>");
  const items = [];
  for (const r of rows) {
    const a = r.match(/<td class="title[^"]*">\s*<a href="([^"]+)">([\s\S]*?)<\/a>/);
    if (!a) continue;
    items.push({
      title: clean(a[2]),
      date: (r.match(/class="date">([\d-]+)/) || [])[1] || "",
      url: BASE + a[1].replace(/\?$/, ""),
      pinned: /class="notice"/.test(r),
      hasFile: /icon_File/.test(r),
    });
  }
  return items;
}

// 식단표: 요일별 아침/점심/저녁
async function menu() {
  const html = await getHtml(`${BASE}/main/contents/todayMenu2`);
  const t = html.slice(html.indexOf("<table"), html.indexOf("</table>"));
  const days = [];
  for (const r of t.split("</tr>")) {
    const tds = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (tds.length < 4) continue;
    const [md, dow] = clean(tds[0]).split("\n");
    const list = (s) => clean(s).split("\n").filter(Boolean);
    days.push({ date: md, ymd: toYmd(md), dow, breakfast: list(tds[1]), lunch: list(tds[2]), dinner: list(tds[3]) });
  }
  // 학교 표는 지난 날 자리에 다음 주 날짜를 끼워 넣어 순서가 섞여 있음 → 날짜순 정렬
  return days.sort((a, b) => a.ymd.localeCompare(b.ymd));
}

// "11/22" → "2026-11-22". 연도는 오늘 기준으로 붙이고, 12월↔1월처럼 해가 바뀌는 경우를 보정
function toYmd(md) {
  const [m, d] = String(md).split("/").map(Number);
  const now = new Date(Date.now() + 9 * 3600 * 1000); // 한국 시간 기준
  let y = now.getUTCFullYear();
  const cur = now.getUTCMonth() + 1;
  if (m - cur > 6) y -= 1;       // 예: 1월에 받은 12월 식단 → 작년
  else if (cur - m > 6) y += 1;  // 예: 12월에 받은 1월 식단 → 내년
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// 학사일정: 학교 사이트가 쓰는 JSON 주소(/main/scheduleList)에서 학년도별로 받음
// 학년도는 3월~다음해 2월. 이번 학년도 + 다음 학년도(등록돼 있으면)를 합친다.
async function schedule() {
  const now = new Date();
  const ay = now.getMonth() + 1 >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const seen = new Set();
  const items = [];
  for (const year of [ay, ay + 1]) {
    const qs = new URLSearchParams({ libType: "D", searchDt: "", hakgi: "0", recordCnt: "999", year: String(year) });
    const json = JSON.parse(await getHtml(`${BASE}/main/scheduleList?${qs}`));
    for (const x of json.list || []) {
      const key = `${x.frdt}|${x.todt}|${x.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        start: String(x.frdt).slice(0, 10),
        end: String(x.todt || x.frdt).slice(0, 10),
        title: clean(String(x.title)),
        holiday: x.holidayyn === "Y" || x.scheduletype === "HOL", // 휴일·휴업일 표시용
      });
    }
  }
  return items.sort((a, b) => a.start.localeCompare(b.start));
}

async function main() {
  fs.mkdirSync(DATA, { recursive: true });
  const updatedAt = new Date().toISOString();
  const jobs = {
    "menu.json": menu,
    "board264.json": () => board(264),
    "board301.json": () => board(301),
    "schedule.json": schedule,
  };
  for (const [file, fn] of Object.entries(jobs)) {
    try {
      const items = await fn();
      if (!items.length) throw new Error("결과가 비어 있음(사이트 구조가 바뀌었을 수 있음)");
      fs.writeFileSync(path.join(DATA, file), JSON.stringify({ updatedAt, items }, null, 2));
      console.log(`OK  ${file}: ${items.length}개`);
    } catch (e) {
      console.error(`실패 ${file}: ${e.message} (기존 파일은 그대로 둠)`);
      process.exitCode = 1;
    }
  }
}
main();
