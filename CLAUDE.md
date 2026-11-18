# 목포해양대 정보 웹앱 (비공식)
- 목적: 학교 홈페이지보다 쉽게 승선생활관 식단과 공지를 보는 나 혼자 쓰는 웹앱
- 사용 기기: 아이패드, 폰 (모바일 우선)
- 기능: ① 승선생활관 식단 ② 승선사관부 공지 ③ 해성공지(board/301, 61개)
- 구조: 의존성 없는 정적 사이트. `scripts/update.js`가 학교 사이트를 읽어 `data/*.json`에 저장하고, `index.html`이 그 JSON을 보여줌. 화면: 메인(MMU INFO + 정보·공지 타일) → #info(학식) · #notice(해성공지·승선사관부)
- 배포: GitHub `hooning000/mmu-info`(공개) → https://hooning000.github.io/mmu-info/ . `.github/workflows/update-and-deploy.yml`이 3시간마다 데이터 갱신·커밋 후 Pages 배포. 로컬 수정 전엔 항상 `git pull` (봇이 data 커밋을 계속 올림)
- 커밋 이메일은 noreply(319899905+hooning000@users.noreply.github.com)만 사용
- 실행: `npm run update` (데이터 갱신) → `npm start` → http://localhost:8000
- 디자인: 흰 바탕, 모카 그레이지(#C9B8A3, #F1EBE3, #CBD5C0, #E8EDE2), 글씨 #6E6256, 카카오 빅 산스, 진한 색 금지
- 원칙: 화면 하단에 "비공식 앱, 정확한 내용은 학교 홈페이지 확인" 문구와 원문 링크 유지. 학교 서버에 요청은 최소로(갱신 시 페이지당 1회)
