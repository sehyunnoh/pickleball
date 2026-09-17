# Pickleball Technique Hub — 개발 계획 (v0.1)

작성일: 2026-08-23
전제 문서: [REQUIREMENTS.md](./REQUIREMENTS.md)

---

## 0. 계획의 전제

### 확정 사항 (요구문서 + 추가 결정)

| 항목 | 결정 |
|---|---|
| 언어 / 타겟 | 영어 단일, 글로벌 Improver(3.0–4.0) |
| Phase 1 범위 | 기술 라이브러리 + 용어 사전. 시합 정보 제외 |
| 스택 | Next.js 15 App Router + TS(strict) + Tailwind v4, Vercel |
| 콘텐츠 분담 | **텍스트 초안 = Claude / 검수·승인 = 사용자 / 영상 선정·타임스탬프 = 사용자** |
| 레포 | GitHub **비공개** 레포 + GitHub Actions |
| 디자인 톤 | 차분한 학습자료 톤 (화이트 베이스, 코트 그린 액센트, 가독성 우선) |
| 일정 | **기간 미설정.** 마일스톤은 날짜가 아니라 완료 기준으로 관리 |

### 로컬 환경 (확인 완료)

```
node v24.14.1   npm 11.11.0   git 2.55.0   gh 2.89.0
pnpm 없음 → 패키지 매니저는 npm 사용
D:\workspace\pickleball 는 아직 git 레포가 아님 (M0에서 init)
```

---

## 1. 계획 원칙

**1) 수직 슬라이스 먼저.**
목록·검색·트리를 먼저 만들지 않는다. **기술 딱 1개가 끝까지 동작하는 상세 페이지**를
M1에서 완성한다. 이게 있어야 "이 사이트가 뭔지" 눈으로 확인하고, 스키마의 구멍도
콘텐츠 20개를 쓰기 전에 발견한다.

**2) 콘텐츠 도구를 콘텐츠보다 먼저.**
M2(스크립트/CLI)가 M3(콘텐츠 20개)보다 앞에 온다. 요구문서 15장에서 짚었듯
이 프로젝트의 진짜 병목은 코드가 아니라 콘텐츠다. 손으로 JSON을 쓰게 두면
큐레이션이 3일 만에 멈춘다. 도구에 먼저 투자한다.

**3) 스키마 변경은 M3 전에 끝낸다.**
콘텐츠 20개를 쓴 뒤 스키마를 바꾸면 20개를 전부 손봐야 한다.
M1의 슬라이스로 스키마를 검증하고, **M3 시작 = 스키마 동결.**

**4) M3와 M4는 병렬로 돈다.**
콘텐츠 작성(사람 손)과 탐색 UI 구현(코드)은 서로 의존하지 않는다.
콘텐츠 배치를 돌리는 사이에 UI를 짠다.

---

## 2. 의존 관계

```
M0 준비
 └─→ M1 스켈레톤 + 수직 슬라이스  ← 스키마 확정 지점
      └─→ M2 콘텐츠 도구
           ├─→ M3 콘텐츠 생산 (P0 20개)  ─┐
           └─→ M4 탐색 UI                ─┤  ← 병렬
                                          ↓
                                    M5 홈 + 마감(SEO/성능)
                                          └─→ M6 배포 + 자동화
                                                └─→ M7 출시 후
```

**크리티컬 패스**: M0 → M1 → M2 → **M3** → M5 → M6.
M3(콘텐츠)가 가장 길다. M2가 끝나는 즉시 M3 배치를 시작해서 M4와 겹쳐 돌린다.

담당 표기: 🤖 Claude / 👤 사용자 / 🤝 공동

---

## 3. M0 — 준비

계정·키 발급이라 **사용자만 할 수 있는 일이 대부분**이다. 여기서 막히면 뒤가 전부 막힌다.

| ID | 작업 | 담당 | 완료 기준 |
|---|---|---|---|
| M0-1 | `git init` + `.gitignore` + 초기 커밋 | 🤖 | 로컬 레포 생성, docs/ 커밋됨 |
| M0-2 | GitHub 비공개 레포 생성 및 push (`gh repo create`) | 🤝 | 원격에 main 브랜치 존재 (실행 전 승인 필요) |
| M0-3 | Google Cloud 프로젝트 → **YouTube Data API v3 키** 발급 | 👤 | `.env.local`에 `YOUTUBE_API_KEY=` 설정 |
| M0-4 | Vercel 계정에 레포 연결 | 👤 | Vercel 프로젝트 생성 (배포는 M6) |
| M0-5 | 도메인 후보 결정 | 👤 | 보류 가능 — M6까지만 정하면 됨 |

**M0-3 상세** (한 번만 하면 되는 일이라 순서만 적어둡니다)
1. console.cloud.google.com → 새 프로젝트
2. "APIs & Services" → Library → **YouTube Data API v3** → Enable
3. Credentials → Create Credentials → API key
4. 키 제한: "API restrictions"에서 YouTube Data API v3만 허용
5. `.env.local`에 저장. **이 파일은 `.gitignore`에 들어가 있어야 한다** (M0-1에서 처리)

> API 키는 채팅에 붙여넣지 말고 `.env.local`에 직접 넣어주세요.

---

## 4. M1 — 스켈레톤 + 수직 슬라이스

**목표: `third-shot-drop` 한 개가 영상 구간 재생까지 포함해 완전히 동작하는 상세 페이지.**

| ID | 작업 | 담당 | 산출물 |
|---|---|---|---|
| M1-1 | `create-next-app` (TS, Tailwind, App Router, ESLint) | 🤖 | 프로젝트 뼈대 |
| M1-2 | 디자인 토큰 정의 (색/타이포/간격/다크모드) | 🤖 | `app/globals.css` CSS 변수 |
| M1-3 | Zod 콘텐츠 스키마 | 🤖 | `lib/schema.ts` |
| M1-4 | 콘텐츠 로더 + 빌드 시 검증 fail-fast | 🤖 | `lib/content.ts` |
| M1-5 | `LiteYouTube` 컴포넌트 (facade, nocookie, start/end) | 🤖 | `components/LiteYouTube.tsx` |
| M1-6 | 기술 상세 페이지 레이아웃 (요구문서 6장 순서 그대로) | 🤖 | `app/techniques/[slug]/page.tsx` |
| M1-7 | 시드 콘텐츠 1개 작성 (`third-shot-drop`) | 🤖 초안 / 👤 검수 | `content/techniques/third-shot-drop.json` |
| M1-8 | 그 기술의 영상 2개 큐레이션 | 👤 | JSON `videos[]` 2건 |
| M1-9 | 기본 레이아웃/헤더/푸터 | 🤖 | `app/layout.tsx` |

**디자인 토큰 초안** (M1-2, 차분한 학습자료 톤)

```
--bg            #ffffff / dark #0e1116
--surface       #f7f8f7 / dark #171b21
--text          #161a1d / dark #e8eaed
--text-muted    #5b6470 / dark #9aa4b2
--accent        #2f7a4d   (코트 그린 — 링크, 액티브 필터, 난이도 배지)
--accent-soft   #e8f3ec / dark #17301f
--border        #e3e6e4 / dark #262c34
난이도 색: beginner 그린 / intermediate 앰버 / advanced 레드 (텍스트 라벨 병기, 색만으로 구분 금지)
본문 폰트: system-ui 스택 (웹폰트 없음 — LCP 우선)
본문 폭: 68ch. 긴 설명을 읽는 사이트이므로 행장 제한이 중요
```

**완료 기준**
- `npm run dev`에서 `/techniques/third-shot-drop`이 요구문서 6장의 섹션 순서대로 렌더
- 영상 썸네일 클릭 → 지정한 `start` 초부터 재생
- 스키마에 없는 필드를 JSON에 넣으면 **빌드가 실패**
- 라이트/다크 모두 정상, 모바일 375px에서 깨짐 없음

**이 시점에 얻는 것**: 스키마의 현실성 검증. 실제로 한 개를 채워보면
"드릴에 코트 다이어그램이 필요하다" 같은 게 여기서 드러난다. → **스키마 수정은 지금.**

---

## 5. M2 — 콘텐츠 도구

**목표: 영상 하나 추가하는 데 드는 비용을 "URL 붙여넣기 한 줄"로 낮춘다.**

| ID | 작업 | 담당 | 산출물 |
|---|---|---|---|
| M2-1 | `add:video` CLI — URL 파싱, API로 메타 자동 채움, JSON append | 🤖 | `scripts/add-video.ts` |
| M2-2 | `new:technique` CLI — 스키마 기반 빈 JSON 생성 | 🤖 | `scripts/new-technique.ts` |
| M2-3 | `validate` — 전체 콘텐츠 Zod 검증 + slug 참조 무결성 | 🤖 | `scripts/validate-content.ts` |
| M2-4 | `fetch:videos` — 기술별 API 검색 → `videos-auto.json` | 🤖 | `scripts/fetch-videos.ts` |
| M2-5 | `check:links` — 큐레이션 영상 생존/임베드 가능 확인 | 🤖 | `scripts/check-links.ts` |

**npm scripts**

```jsonc
{
  "dev":            "next dev",
  "build":          "npm run validate && next build",
  "validate":       "tsx scripts/validate-content.ts",
  "new:technique":  "tsx scripts/new-technique.ts",
  "add:video":      "tsx scripts/add-video.ts",
  "fetch:videos":   "tsx scripts/fetch-videos.ts",
  "check:links":    "tsx scripts/check-links.ts",
  "auto:curate":    "tsx scripts/auto-curate.ts"
}
```

**M2-1 동작 명세** (제일 중요한 도구)

```bash
npm run add:video -- --technique atp --url "https://youtu.be/dQw4w9?t=95" --type slow-mo --end 128 --note "watch the hip rotation"
```

1. URL에서 `videoId`와 `?t=` / `#t=` / `&start=` 파싱 → `start: 95`
2. `videos.list`로 title / channelTitle / duration / `embeddable` 조회 (1 unit)
3. `embeddable: false`면 **거부하고 경고** — 임베드 안 되는 영상을 등록하는 사고 방지
4. 중복 `youtubeId` 있으면 거부
5. `content/techniques/atp.json`의 `videos[]`에 append, `curatedAt` 자동 기입
6. 성공 시 로컬 미리보기 URL 출력

**M2-3 무결성 검사 항목**
- 모든 `prerequisites` / `leadsTo` / `relatedTerms` slug가 실제 존재하는가
- 스킬 트리에 순환(cycle)이 없는가
- `published` 기술에 영상이 2개 이상인가
- `start < end`인가

**완료 기준**: 영상 URL 하나를 CLI에 넣으면 JSON에 들어가고 dev 서버 페이지에 바로 뜬다.

---

## 6. M3 — 콘텐츠 생산 (P0 20개) ★ 최장 구간

**진행 방식: 4개씩 5배치.** 한 배치가 승인되면 다음 배치를 시작한다.
배치를 쪼개는 이유는 초안 20개를 한꺼번에 받으면 검수가 감당이 안 되기 때문.

**배치당 사이클**

```
🤖 초안 4개 작성 (JSON, videos[] 비움)
   ↓
🤖 각 기술 영상 후보 5~8개 제시 (fetch:videos 결과 + 채널/조회수/길이 표)
   ↓
👤 검수: 설명 수정, 영상 2~4개 선택, 타임스탬프 지정
   ↓
🤖 add:video로 반영 → validate 통과 → status: published
```

**배치 구성** (선행 기술이 먼저 오도록 스킬 트리 순서를 따름)

| 배치 | 기술 | 비고 |
|---|---|---|
| B1 | Split Step, Kitchen Line Positioning, Dink (Straight), Deep Return | 트리의 뿌리. 다른 기술이 참조함 |
| B2 | Return and Advance, Third Shot Drop*, Third Shot Drive, Transition Zone Footwork | *M1에서 이미 작성 |
| B3 | Dink (Cross-court), Reset, Block / Counter, Punch Volley | 소프트 게임 축 |
| B4 | Speed-up, Overhead / Smash, Shake and Bake, Offensive Lob | 공격 축 |
| B5 | ATP, Erne, Volley Serve, (예비 1) | 특수 기술 — 영상 찾기 제일 쉬움 |

**병행 작업**: 🤖 용어 사전 60개 초안 일괄 작성 (짧아서 배치 불필요) → 👤 일괄 검수

**"published" 승인 체크리스트** (품질 게이트)

- [ ] `summary`가 2~3문장이고 전문 용어 없이 읽히는가
- [ ] `howTo`가 4~6스텝, 각 스텝이 **동작 지시문**인가 (설명문 아님)
- [ ] `commonMistakes`가 실제로 자주 보는 실수인가 (일반론 아님)
- [ ] 드릴이 혼자 또는 2인으로 실제 실행 가능한가
- [ ] 영상 2개 이상, 그중 최소 1개는 `instruction` 타입
- [ ] 타임스탬프가 정확한가 (실제로 그 초에 해당 장면이 나오는가)
- [ ] `prerequisites` / `leadsTo`가 트리에서 말이 되는가

**완료 기준**: P0 20개 `published`, `npm run validate` 통과, 용어 60개 등록.

---

### 6.1 계획 변경 — 타임스탬프 게이트 완화 (2026-08-24)

**바꾼 이유.** §11 리스크 표의 "M3에서 동력 소진"이 실제로 발생했다. 다만 예측한
형태와 달랐다 — 밀린 것은 텍스트 검수가 아니라 **영상 선정과 타임스탬프 지정**이었다.
30개 기술의 텍스트가 다 나온 뒤에도 클립이 붙은 건 1개였다. 대응으로 준비해 둔
"출시 기준을 20개 → 12개로 낮춘다"는 이 병목에 듣지 않는다. 12개도 손으로
골라야 하는 건 똑같기 때문이다.

**바꾼 것.** 영상 제목을 기술 이름과 매칭해서 클립을 자동으로 채우고
(`npm run auto:curate`), 그렇게 채운 클립에는 `verified: false`를 박아 페이지에
**Unverified** 라벨을 노출한다. 게이트(클립 2개, 그중 1개는 `instruction`)는
그대로 두되, "타임스탬프를 직접 재생해서 확인했는가"는 published의 **선결 조건이
아니라 사후 업그레이드**가 된다.

**바꾸지 않은 것.** 손으로 고른 클립이 목표라는 것. 자동 클립은 그 자리를 비워두지
않기 위한 **자리표시자**이고, 사이트가 그걸 숨기지 않는다. About·홈·메타 설명에서
"모든 클립을 손으로 골랐다"고 하던 문구는 전부 사실에 맞게 고쳤다 — 라벨만 붙이고
카피를 그대로 두면 라벨이 하는 일이 없다.

**추측은 안 한다.** 매칭이 기술 이름의 절반을 못 채우면 그 기술은 건너뛰고 보고한다.
`bert`가 그 사례다 — "pickleball bert" 검색은 Erne·ATP 영상만 돌려주므로,
상위 결과를 그냥 쓰면 **Bert 페이지에 다른 샷 영상이 올라간다.** `bert`는 클립 없이
draft로 남겨 두는 쪽이 맞다.

**남은 일**: unverified 클립 47개를 타임스탬프가 있는 것으로 교체. 순서는
`docs/CURATION.md`가 관리하고, 트래픽이 붙는 기술부터 한다.

---

## 7. M4 — 탐색 UI (M3와 병렬)

| ID | 작업 | 담당 | 산출물 |
|---|---|---|---|
| M4-1 | 기술 목록 페이지 + 카드 그리드 | 🤖 | `app/techniques/page.tsx` |
| M4-2 | 필터바 (카테고리/난이도/코트존/상황), URL 쿼리 동기화 | 🤖 | `components/FilterBar.tsx` |
| M4-3 | 검색 인덱스 빌드 + Fuse.js 검색 UI (⌘K) | 🤖 | `lib/search.ts` |
| M4-4 | 스킬 트리 SVG 렌더 (계층 레이아웃, 자체 구현) | 🤖 | `app/skill-tree/page.tsx` |
| M4-5 | 진도 체크 (localStorage, 트리·카드에 반영) | 🤖 | `components/ProgressToggle.tsx` |
| M4-6 | 용어 사전 페이지 (A–Z + 검색 + 상호 링크) | 🤖 | `app/glossary/` |

**주의점**
- 필터 상태는 URL 쿼리로 (`?category=soft-game&difficulty=beginner`) — 공유 가능해야 함
- 스킬 트리는 라이브러리 없이 SVG 직접. 노드 30개 규모면 계층 레이아웃 손계산이 더 안정적
- localStorage 접근은 전부 try/catch (프라이빗 모드 대응)
- 진도 체크는 서버 저장이 없다는 걸 UI에서 밝힌다 ("saved on this device")

**완료 기준**: 필터·검색·트리·진도 4개가 20개 기술 데이터 위에서 정상 동작.

---

## 8. M5 — 홈 + 마감

| ID | 작업 | 담당 | 산출물 |
|---|---|---|---|
| M5-1 | 홈 페이지 (히어로, 카테고리 진입, 추천 기술) | 🤖 | `app/page.tsx` |
| M5-2 | `/about` (사이트 소개, 데이터 출처, 영상 저작권 명시) | 🤝 | `app/about/page.tsx` |
| M5-3 | 메타데이터 + JSON-LD (`HowTo`, `VideoObject`) | 🤖 | `lib/seo.ts` |
| M5-4 | `sitemap.xml`, `robots.txt`, OG 이미지 동적 생성 | 🤖 | `app/sitemap.ts`, `app/opengraph-image.tsx` |
| M5-5 | 성능 튜닝 (facade 검증, 이미지, 번들 점검) | 🤖 | Lighthouse 리포트 |
| M5-6 | 접근성 점검 (키보드, 대비, 스크린리더 라벨) | 🤖 | 점검 결과 + 수정 |
| M5-7 | 404 / 빈 상태 / 에러 바운더리 | 🤖 | — |

**완료 기준**: Lighthouse 모바일 Performance ≥ 90, Accessibility ≥ 95, `check:links` 0 실패.

---

## 9. M6 — 배포 + 자동화

| ID | 작업 | 담당 | 산출물 |
|---|---|---|---|
| M6-1 | Vercel 프로덕션 배포, 환경변수 등록 | 🤝 | 라이브 URL |
| M6-2 | 커스텀 도메인 연결 | 👤 | — |
| M6-3 | CI: PR마다 `validate` + `build` + 타입체크 | 🤖 | `.github/workflows/ci.yml` |
| M6-4 | CI: 주 1회 `fetch:videos` → 변경 시 자동 PR | 🤖 | `.github/workflows/refresh-videos.yml` |
| M6-5 | CI: 주 1회 `check:links` → 실패 시 이슈 자동 생성 | 🤖 | `.github/workflows/check-links.yml` |
| M6-6 | GitHub Secrets에 `YOUTUBE_API_KEY` 등록 | 👤 | — |
| M6-7 | **애널리틱스** — GA4와 동의 배너를 걷어내고 Vercel Web Analytics로 교체(2026-09-17, REQUIREMENTS §16). 남은 일은 Vercel 대시보드에서 Web Analytics를 **Enable** 하는 것뿐 | 🤝 | 대시보드에 방문이 잡힘 |

**브랜치 전략** (단순하게)
- `main` = 프로덕션. Vercel 자동 배포
- 기능/콘텐츠 작업은 `feat/…`, `content/…` 브랜치 → PR → Vercel preview로 확인 후 머지
- 콘텐츠 PR은 preview URL에서 영상 재생까지 확인하고 머지

**완료 기준**: main push → 자동 배포 성공. 주간 워크플로 수동 실행(`workflow_dispatch`) 1회 성공.

---

## 10. M7 — 출시 후 (범위만 명시)

| 항목 | 내용 |
|---|---|
| ~~P1 기술 10개 추가~~ | **완료** — 11개 작성·published |
| **AdSense** | 콘텐츠 20개 이상 + 월 방문이 붙은 뒤 신청. 슬롯 위치는 이미 확보돼 있음(`components/AdSlot.tsx`), 승인 후 `NEXT_PUBLIC_ADS_ENABLED=true` + `<ins>` 태그 + 인증 CMP |
| ~~학습 경로 (`/paths`)~~ | **완료** (2026-08-25). 3개: Get to the kitchen / Stop getting attacked / Win more third shots. `content/paths/*.json` + `PathSchema`. 증상으로 색인하고, `validate`가 각 단계의 slug 해석과 draft 참조를 막는다 |
| 콘텐츠 유지보수 | 죽은 링크 교체, 신규 영상 반영 (월 1회 루틴) |
| **Phase 2: 시합 정보** | 수집 방식 재논의 필요 → **별도 요구문서부터** 작성 |
| Phase 3: 계정 | 진도 서버 동기화, 즐겨찾기 |

---

## 11. 리스크와 중단 지점

| 리스크 | 신호 | 대응 |
|---|---|---|
| **M3에서 동력 소진** | 배치 B2~B3에서 검수가 밀림 | 출시 기준을 P0 20개 → **12개**로 낮춘다. 12개짜리 잘 만든 사이트가 20개짜리 미완성보다 낫다 |
| 타임스탬프 지정이 생각보다 오래 걸림 | 영상 1개에 5분 이상 | 초기엔 `start`만 지정하고 `end`는 생략 (스키마상 선택 필드) |
| M1에서 스키마 구멍 발견 | 필드가 모자람 | 예정된 일이다. M3 전이므로 비용이 싸다. 고치고 진행 |
| YouTube API 키 발급 지연 | M0-3 미완 | M1·M2 대부분은 키 없이 진행 가능. `add:video`의 메타 자동채움만 막힘 → 수동 입력 폴백 옵션 추가 |
| 영어 표현 부자연스러움 | 검수 시 계속 걸림 | 배치 B1에서 문체 샘플을 확정하고 이후 배치는 그 문체를 따름 |

---

## 12. 지금 바로 할 일

**사용자 쪽 (병렬로 진행 가능)**
1. YouTube Data API v3 키 발급 → `.env.local`에 저장 (M0-3, 위 4단계 참고)
2. GitHub 비공개 레포를 만들지 — **"만들어줘" 한마디 주시면 `gh repo create`로 진행**합니다 (승인 없이는 안 함)
3. 도메인 후보 생각해두기 (M6까지 여유 있음)

**Claude 쪽 (승인 즉시 시작)**
- M0-1: `git init` + `.gitignore` + docs 커밋
- M1 전체: Next.js 셋업부터 `third-shot-drop` 상세 페이지 완성까지

**첫 데모 지점** = M1 완료. 이때 `/techniques/third-shot-drop`을 실제로 보고
"이 방향이 맞는지"를 판단하면 됩니다. 여기서 방향을 틀어도 손해가 거의 없습니다.
