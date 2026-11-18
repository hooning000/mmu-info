# 목포해양대 정보 웹앱 (비공식)
- 목적: 학교 홈페이지보다 쉽게 승선생활관 식단과 공지를 보는 나 혼자 쓰는 웹앱
- 사용 기기: 아이패드, 폰 (모바일 우선)
- 기능: 정보(① 승선생활관 식단 ② 학사일정 달력 — /main/scheduleList JSON, 학년도 3월~2월) · 공지(③ 해성공지 board/301 ④ 승선사관부 board/264)
- 구조: 의존성 없는 정적 사이트. `scripts/update.js`가 학교 사이트를 읽어 `data/*.json`에 저장하고, `index.html`이 그 JSON을 보여줌. 화면: 메인(MMU INFO + 정보·공지 타일) → #info(학식) · #notice(해성공지·승선사관부)
- 배포: GitHub `hooning000/mmu-info`(공개) → https://hooning000.github.io/mmu-info/ . `.github/workflows/update-and-deploy.yml`이 3시간마다 데이터 갱신·커밋 후 Pages 배포. 로컬 수정 전엔 항상 `git pull` (봇이 data 커밋을 계속 올림)
- 커밋 이메일은 noreply(319899905+hooning000@users.noreply.github.com)만 사용
- 실행: `npm run update` (데이터 갱신) → `npm start` → http://localhost:8000
- 디자인(시안 3 · 노을 수채): 900px 이상은 왼쪽 그림 패널(assets/sea.webp, sticky 100vh)+오른쪽 내용 560px, 900px 미만은 위쪽 그림 띠 260px+흰 물결. 색 --sea #2F6C9F(아이콘·링크) --wave #BFDDF0 --foam #EEF6FB --buoy #C8442F(메인 공지 뱃지에만) --ink #1E3448 --ink-sub #4F647A --sky #BCD8EE, Noto Sans KR. 그림 위 그림자·그라데이션·반투명 막·이모지 금지
- 원칙: 화면 하단에 "비공식 앱, 정확한 내용은 학교 홈페이지 확인" 문구와 원문 링크 유지. 학교 서버에 요청은 최소로(갱신 시 페이지당 1회)
