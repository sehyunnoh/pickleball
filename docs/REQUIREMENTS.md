# Pickleball Technique Hub — 요구사항 문서 (v0.1)

작성일: 2026-08-23
상태: 초안 (Phase 1 확정, Phase 2+ 방향만 기술)

---

## 1. 한 줄 정의

> **피클볼 기술(shot)을 하나씩 깊게 파고들 수 있는 영어권 레퍼런스 사이트.**
> 각 기술마다 "무엇을 / 언제 / 어떻게"를 글로 설명하고, 그 기술을 실제로 보여주는
> 엄선된 유튜브 클립을 **타임스탬프 단위로** 연결한다.

기존 사이트(The Dink, Pickleheads, Selkirk TV)는 "블로그 글 + 영상 나열" 구조라
"백핸드 롤 발리 하나만 제대로 보고 싶다"는 요구를 못 채운다. 이 사이트의 차별점은
**기술 단위 구조화 데이터 + 구간 지정 영상 링크 + 기술 간 선후관계(스킬 트리)** 세 가지다.

---

## 2. 확정된 결정 사항

| 항목 | 결정 |
|---|---|
| 타겟 / 언어 | 글로벌, **영어 단일 언어** |
| Phase 1 범위 | **기술 라이브러리 + 용어 사전만.** 시합 정보는 Phase 2로 미룸 |
| 영상 수집 | **수동 큐레이션이 원칙**, YouTube Data API는 "더 보기" 보조용 |
| 스택 | **Next.js (App Router) + TypeScript + Tailwind CSS**, Vercel 배포 |
| 데이터 저장 | Phase 1은 **DB 없음.** 레포 내 JSON 파일 + SSG |

---

## 3. 타겟 사용자

| 페르소나 | 상황 | 필요한 것 |
|---|---|---|
| **Beginner (DUPR 2.5–3.0)** | 룰은 알지만 3rd shot이 뭔지 모름 | 용어 사전, 기초 기술, "다음에 뭘 배워야 하나" |
| **Improver (3.0–4.0)** — 주 타겟 | 특정 샷이 안 됨. "내 드롭이 자꾸 뜬다" | 기술별 흔한 실수, 슬로우모션 클립, 드릴 |
| **Coach / Rec league 운영자** | 레슨 자료가 필요 | 기술 링크 하나로 공유, 드릴 목록 |

주 타겟은 **Improver**. 이 층이 유튜브를 제일 많이 뒤지고, 제일 많이 헤맨다.

---

## 4. Phase 1 범위 (MVP)

### 4.1 포함 (In scope)

- **기술 라이브러리**: 시드 기술 25~30개, 각각 상세 페이지
- **기술 목록 페이지**: 카테고리 / 난이도 / 코트 존 / 상황 필터
- **큐레이션 영상**: 기술당 2~5개, 타임스탬프 구간 지정
- **용어 사전 (Glossary)**: 60~80개 용어, 기술 페이지와 상호 링크
- **스킬 트리 뷰**: 선행 기술 → 후행 기술 그래프
- **클라이언트 검색**: 기술명/별칭/용어 대상 (Fuse.js, 인덱스 프리빌드)
- **SEO**: 기술별 정적 페이지, OG 이미지, JSON-LD (HowTo / VideoObject)
- **다크모드**, 모바일 우선 반응형

### 4.2 제외 (Out of scope — 명시적으로 안 함)

- 시합/대회 정보 (→ Phase 2)
- 사용자 계정, 로그인, 서버 저장 (진도 체크는 localStorage만)
- 댓글, 커뮤니티, UGC
- 영상 파일 호스팅 (항상 YouTube iframe 임베드. 다운로드/재업로드 절대 안 함)
- 결제, 유료 콘텐츠
- 다국어(i18n) — 단, 데이터 스키마는 나중에 붙일 수 있게 텍스트 필드를 분리해 둔다

---

## 5. 정보 구조 (IA)

```
/                       홈 — 히어로, 카테고리 진입, 신규/추천 기술 3~4개
/techniques             기술 목록 + 필터 + 검색
/techniques/[slug]      기술 상세 (핵심 페이지)
/skill-tree             기술 선후관계 그래프
/glossary               용어 사전 (A–Z + 검색)
/glossary/[slug]        용어 상세 (짧음. 관련 기술로 유도)
/paths/[slug]           학습 경로 (예: "Get to the kitchen") — Phase 1 후반
/about                  사이트 소개, 데이터 출처, 기여 방법
```

Phase 2에서 `/tours`, `/tours/[slug]`, `/calendar` 추가 예정.

---

## 6. 기술 상세 페이지 — 화면 명세

핵심 페이지이므로 섹션 순서를 고정한다. 사용자는 대부분 검색으로 이 페이지에
바로 착지하므로, **스크롤 없이 "이게 뭔지"가 보여야 한다.**

```
┌─────────────────────────────────────────────┐
│ Around the Post (ATP)          [Advanced]   │  ← 이름 + 난이도 배지
│ aka: ATP                                    │
│ #specialty  #sideline  #rally               │  ← 태그 (클릭 시 필터 목록으로)
├─────────────────────────────────────────────┤
│ ▶ 대표 영상 (임베드, 타임스탬프 시작)        │  ← 첫 화면에 반드시 보임
├─────────────────────────────────────────────┤
│ What it is        — 2~3문장                 │
│ When to use it    — 불릿 3~4개 (상황)       │
│ How to hit it     — 번호 매긴 실행 스텝 4~6개│
│ Common mistakes   — 불릿 3~5개              │
│ Drills            — 카드형, 반복 횟수 포함   │
├─────────────────────────────────────────────┤
│ Watch it          — 큐레이션 영상 그리드     │
│   [instruction] [slow-mo] [in a real game]  │  ← 타입별 탭
│   ── More on YouTube (auto) ──              │  ← API 보조 결과, 시각적으로 구분
├─────────────────────────────────────────────┤
│ Prerequisites  →  This shot  →  Leads to    │  ← 스킬 트리 미니맵
│ Related terms: kitchen, transition zone     │
└─────────────────────────────────────────────┘
```

**규칙**

- 큐레이션 영상과 API 자동 영상은 **시각적으로 명확히 구분**한다. 자동 결과는
  "우리가 검증하지 않았음"을 라벨로 밝힌다.
- 임베드는 성능상 **facade 방식**(썸네일 클릭 시 iframe 로드, `lite-youtube-embed`).
  기술 페이지에 iframe 5개를 그대로 깔면 LCP가 무너진다.
- 임베드 도메인은 `youtube-nocookie.com` 사용.

---

## 7. 데이터 모델

### 7.1 Technique (`content/techniques/*.json`)

```jsonc
{
  "slug": "third-shot-drop",
  "name": "Third Shot Drop",
  "aka": ["3rd shot drop", "the drop"],
  "category": "transition",        // serve | return | transition | soft-game | attack | defense | specialty | movement | strategy
  "difficulty": "intermediate",    // beginner | intermediate | advanced
  "courtZone": ["baseline", "transition"],   // baseline | transition | kitchen | sideline
  "situation": ["third-shot", "rally"],      // serve | return | third-shot | rally | defense
  "handedness": "both",            // forehand | backhand | both | n/a

  "summary": "A soft, arcing shot from the baseline that lands in the opponents' kitchen, letting you advance to the net.",
  "whenToUse": [
    "You are still at the baseline after the return.",
    "Opponents are already at the kitchen line and ready.",
    "The return was deep and a drive would be too risky."
  ],
  "howTo": [
    "Get low - bend the knees, not the waist.",
    "Contact the ball out in front, below waist level.",
    "Push with the shoulder; keep the wrist quiet.",
    "Aim for the peak of the arc on your side of the net.",
    "Follow the shot forward into the transition zone."
  ],
  "commonMistakes": [
    "Hitting it too flat - the ball must peak before the net.",
    "Standing tall and chopping down at the ball.",
    "Sprinting to the kitchen before the drop lands."
  ],
  "drills": [
    {
      "name": "Baseline drop to target",
      "description": "Partner feeds from the kitchen. Drop 20 balls into a towel placed in the kitchen.",
      "reps": "3 sets of 20",
      "players": 2
    }
  ],

  "prerequisites": ["dink-straight"],
  "leadsTo": ["transition-zone-footwork", "reset"],
  "relatedTerms": ["kitchen", "transition-zone", "shake-and-bake"],

  "videos": [
    {
      "youtubeId": "XXXXXXXXXXX",
      "title": "The 3 keys to a consistent third shot drop",
      "channel": "Channel Name",
      "type": "instruction",       // instruction | slow-mo | gameplay | drill
      "start": 74,                 // 초 단위. 이 구간부터 재생
      "end": 152,                  // 선택. UI에서 "78s clip" 표시용
      "note": "Focus on the knee bend at 1:40.",
      "curatedAt": "2026-08-23"
    }
  ],

  "status": "published",           // draft | published
  "updatedAt": "2026-08-23"
}
```

**설계 의도**

- `prerequisites` / `leadsTo`가 스킬 트리의 엣지가 된다. 별도 그래프 파일을 두지
  않고 기술 파일에서 파생시킨다 (단일 진실 공급원).
- `start`/`end`가 이 사이트의 핵심 자산이다. "영상 링크"가 아니라 "**구간** 링크".
- `status: draft`인 항목은 빌드에서 제외 → 미완성 기술을 안전하게 커밋 가능.

### 7.2 Term (`content/glossary/*.json`)

```jsonc
{
  "slug": "kitchen",
  "term": "Kitchen",
  "aka": ["non-volley zone", "NVZ"],
  "definition": "The 7-foot area on each side of the net where you may not hit a volley.",
  "seeAlso": ["kitchen-line", "erne"],
  "relatedTechniques": ["dink-crosscourt", "reset"]
}
```

### 7.3 자동 수집 영상 (`data/generated/videos-auto.json`)

빌드 타임 스크립트 산출물. **레포에 커밋한다** (빌드 재현성 + 할당량 절약).

```jsonc
{
  "third-shot-drop": {
    "fetchedAt": "2026-08-23T00:00:00Z",
    "query": "pickleball third shot drop tutorial",
    "results": [
      { "youtubeId": "...", "title": "...", "channel": "...", "publishedAt": "...", "duration": "PT8M12S" }
    ]
  }
}
```

---

## 8. YouTube 연동 설계

### 8.1 원칙

1. **런타임에 YouTube API를 호출하지 않는다.** 전부 빌드 타임.
   → API 키 노출 없음, 페이지 응답 빠름, 할당량 폭발 없음.
2. 큐레이션 영상이 1순위. 자동 결과는 큐레이션이 부족한 기술의 빈칸 메꾸기.
3. 영상은 **임베드만.** 다운로드·재호스팅·자막 재배포 안 함 (YouTube ToS 준수).

### 8.2 수집 스크립트 (`npm run fetch:videos`)

- 각 기술의 `name` + `aka`로 검색 쿼리 생성 (예: `pickleball around the post tutorial`)
- `search.list` (100 units/회) → 상위 N개 videoId 수집
- `videos.list` (1 unit/회, 최대 50개 batch)로 길이·조회수·채널·`embeddable` 보강
- 필터: 길이 60초 미만 제외(쇼츠 노이즈), 조회수 하한, 채널 블록/화이트리스트,
  `embeddable: false` 제외
- 결과를 `data/generated/videos-auto.json`에 기록

**할당량 계산**: 일 10,000 units. 기술 30개 × 100 units = 3,000 units.
하루 3회 전체 갱신 가능 — 실제로는 주 1회 GitHub Actions cron이면 충분.

### 8.3 큐레이션 워크플로

수동이 원칙인데 손으로 JSON을 짜는 건 고통스러우므로, **입력 비용을 낮추는 CLI**를 만든다.

```bash
npm run add:video -- --technique atp --url "https://youtu.be/xxxx?t=95" --type slow-mo
# → 제목/채널/길이를 API로 자동 채우고, ?t=95를 start:95로 파싱해 JSON에 append
```

이게 있어야 큐레이션이 실제로 굴러간다. 없으면 콘텐츠가 안 쌓인다.

---

## 9. 시드 기술 목록 (Phase 1 대상)

우선순위 P0 = 출시에 반드시 필요, P1 = 출시 후 곧바로 추가.

| # | Technique | Category | Difficulty | 우선순위 |
|---|---|---|---|---|
| 1 | Volley Serve | serve | beginner | P0 |
| 2 | Drop Serve | serve | beginner | P1 |
| 3 | Deep Return | return | beginner | P0 |
| 4 | Return and Advance | return | beginner | P0 |
| 5 | Third Shot Drop | transition | intermediate | P0 |
| 6 | Third Shot Drive | transition | intermediate | P0 |
| 7 | Dink (Straight) | soft-game | beginner | P0 |
| 8 | Dink (Cross-court) | soft-game | intermediate | P0 |
| 9 | Topspin Dink | soft-game | advanced | P1 |
| 10 | Dead Dink | soft-game | intermediate | P1 |
| 11 | Reset | defense | intermediate | P0 |
| 12 | Block / Counter | defense | intermediate | P0 |
| 13 | Punch Volley | attack | beginner | P0 |
| 14 | Roll Volley | attack | advanced | P1 |
| 15 | Speed-up | attack | intermediate | P0 |
| 16 | Backhand Flick | attack | advanced | P1 |
| 17 | Overhead / Smash | attack | intermediate | P0 |
| 18 | Offensive Lob | specialty | advanced | P0 |
| 19 | Defensive Lob | defense | intermediate | P1 |
| 20 | ATP (Around the Post) | specialty | advanced | P0 |
| 21 | Erne | specialty | advanced | P0 |
| 22 | Bert | specialty | advanced | P1 |
| 23 | Poach | strategy | intermediate | P1 |
| 24 | Stacking | strategy | intermediate | P1 |
| 25 | Shake and Bake | strategy | intermediate | P0 |
| 26 | Split Step | movement | beginner | P0 |
| 27 | Transition Zone Footwork | movement | intermediate | P0 |
| 28 | Kitchen Line Positioning | movement | beginner | P0 |
| 29 | Chicken Wing Defense | defense | intermediate | P1 |
| 30 | Lob Defense / Switching | defense | advanced | P1 |

P0 = 20개. **출시 기준은 P0 20개 전부 published + 각각 큐레이션 영상 최소 2개.**

---

## 10. 스킬 트리

`prerequisites` 엣지로 만든 DAG. Phase 1은 화려한 인터랙션 없이 계층형 정적 레이아웃.

```
Split Step ──┬─→ Kitchen Line Positioning ──→ Dink (Straight) ──┬─→ Dink (Cross-court) ──→ Topspin Dink
             │                                                  ├─→ Speed-up ──→ Backhand Flick
             │                                                  └─→ Reset ──→ Block / Counter
             └─→ Deep Return ──→ Return and Advance
                                        │
                                        ├─→ Third Shot Drop ──→ Transition Zone Footwork ──→ Erne ──→ Bert
                                        └─→ Third Shot Drive ──→ Shake and Bake
```

- 구현: SVG 직접 렌더 (그래프 라이브러리 없이). 노드 30개 규모면 충분하다.
- 노드에 "익힘" 체크 표시(localStorage) → 내 진도가 트리 위에 색으로 보임.
  재방문 동기를 만드는 유일한 기능이므로 Phase 1에 넣는다.

---

## 11. 비기능 요구사항

| 항목 | 기준 |
|---|---|
| 성능 | Lighthouse Performance ≥ 90 (모바일). LCP < 2.5s. iframe은 facade 로딩 |
| SEO | 기술별 정적 URL, 고유 title/meta, HowTo + VideoObject JSON-LD, sitemap.xml |
| 접근성 | WCAG 2.1 AA. 키보드 내비게이션, 대비 4.5:1, 영상 임베드에 title 속성 |
| 반응형 | 모바일 우선. 코트에서 폰으로 보는 게 주 사용 시나리오 |
| 브라우저 | 최신 2개 버전 (Chrome/Safari/Firefox/Edge) |
| 콘텐츠 무결성 | 큐레이션 영상 링크 유효성 검사 스크립트(주 1회 CI). 삭제된 영상 자동 플래그 |

---

## 12. 기술 스택 상세

```
Next.js 15 (App Router, SSG)
TypeScript (strict)
Tailwind CSS v4
콘텐츠: content/**/*.json  (검증: Zod 스키마, 빌드 시 fail-fast)
검색: Fuse.js + 빌드 타임 인덱스 생성
그래프: 자체 SVG
임베드: lite-youtube-embed
배포: Vercel (main 브랜치 자동 배포)
CI: GitHub Actions — 스키마 검증, 링크 체크, 주 1회 fetch:videos → PR 자동 생성
```

**DB를 쓰지 않는 이유**: Phase 1 콘텐츠는 파일 30~100개. Git이 곧 CMS이고,
버전 관리·리뷰·롤백이 공짜로 따라온다. 사용자 계정이 필요해지는 Phase 7에
Postgres(Neon/Supabase)를 도입한다.

---

## 13. 디렉터리 구조 (제안)

```
pickleball/
├─ app/
│  ├─ page.tsx
│  ├─ techniques/page.tsx
│  ├─ techniques/[slug]/page.tsx
│  ├─ skill-tree/page.tsx
│  └─ glossary/
├─ components/
│  ├─ TechniqueCard.tsx  VideoGrid.tsx  LiteYouTube.tsx
│  └─ FilterBar.tsx  SkillTree.tsx  ProgressToggle.tsx
├─ content/
│  ├─ techniques/*.json
│  └─ glossary/*.json
├─ data/generated/videos-auto.json
├─ lib/
│  ├─ schema.ts        (Zod)
│  ├─ content.ts       (로딩 + 검증 + 그래프 파생)
│  └─ search.ts
├─ scripts/
│  ├─ fetch-videos.ts
│  ├─ add-video.ts
│  └─ check-links.ts
└─ docs/REQUIREMENTS.md
```

---

## 14. 로드맵

| Phase | 내용 | 완료 기준 |
|---|---|---|
| **P1 — 기반** | 스택 셋업, 스키마, 기술 3개로 상세 페이지 완성 | 로컬에서 3개 기술 페이지가 영상 포함 정상 렌더 |
| **P2 — 콘텐츠** | P0 기술 20개 작성 + 영상 큐레이션 + 용어 60개 | 20개 published, 각 영상 2개+ |
| **P3 — 탐색** | 목록 필터, 검색, 스킬 트리, 진도 체크 | 필터·검색·트리 동작 |
| **P4 — 출시** | SEO, OG 이미지, 성능 튜닝, Vercel 배포 | Lighthouse 90+, 도메인 연결 |
| **P5 — 자동화** | fetch:videos CI, 링크 체커 | 주간 cron 동작 |
| **P6 — 시합 정보** | 대회 일정/결과 (수집 방식 재논의) | 별도 요구문서 작성 |
| **P7 — 계정** | 로그인, 진도 서버 동기화, 즐겨찾기 | — |

---

## 15. 리스크

| 리스크 | 영향 | 대응 |
|---|---|---|
| **콘텐츠 작성이 병목** | 높음 | 기술 20개 × 상세 설명은 실제로 큰 작업량. 템플릿을 고정하고 한 번에 3개씩 배치 작성 |
| 큐레이션 영상 삭제/비공개 | 중간 | 주 1회 링크 체커. 죽은 링크는 자동 수집 결과로 대체 표시 |
| YouTube API 할당량 | 낮음 | 빌드 타임 + 주 1회 갱신이면 여유 |
| 영상 임베드 차단 | 낮음 | 일부 영상은 `embeddable: false`. 수집 시 플래그 확인해 제외 |
| 영어 콘텐츠 품질 | 중간 | 코칭 용어는 정확도가 생명. 기존 강습 영상 표현을 참고하되 문장은 직접 작성(표절 방지) |
| SEO 경쟁 | 중간 | "third shot drop" 같은 빅 키워드는 포기. "how to stop popping up the third shot drop" 류 롱테일 노림 |

---

## 16. 아직 결정 안 된 것 (다음에 답이 필요)

1. **도메인 이름** — 정해둔 게 있는지? (없으면 후보 제안 가능)
2. **콘텐츠는 누가 쓰는지** — 직접 작성? 아니면 초안을 받아서 검수만?
   → 이게 P2 일정을 좌우한다.
3. **디자인 톤** — 스포츠다운 하이컨트라스트 vs 학습자료다운 차분한 톤?
4. **수익화 의도** — 애드센스/제휴 링크(패들 추천)를 넣을 거면 레이아웃에 자리를 미리 비워둔다.
5. **오픈소스 공개 여부** — 공개하면 기술 데이터에 외부 기여(PR)를 받을 수 있다.
