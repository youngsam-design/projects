# 포트폴리오 콘텐츠 플랫폼 설계

## 1. 목표

관리자 한 명이 브라우저에서 프로젝트를 작성하고 이미지와 영상을 업로드한 뒤, 미리보기와 발행까지 할 수 있는 블록 기반 WYSIWYG CMS를 구축한다.

핵심 사용자 흐름은 다음과 같다.

```text
로그인 → 프로젝트 생성 → 블록 편집 → 미디어 업로드 → 자동 저장
      → 미리보기 → 발행 → 공개 포트폴리오 반영
```

현재 공개 프로젝트 페이지는 계속 동작해야 한다. 기존 HTML 콘텐츠는 한 번에 폐기하지 않고 새 문서 모델로 점진적으로 이전한다.

## 2. 설계 원칙

1. 에디터와 공개 페이지는 같은 문서 스키마를 사용한다.
2. 문서에는 파일 자체가 아니라 `assetId`만 저장한다.
3. 이미지와 영상은 브라우저에서 파일 저장소로 직접 업로드한다.
4. 초안과 발행본을 분리한다.
5. 에디터 UI와 저장 구현 사이에 repository 계층을 둔다.
6. HTML 태그나 임의의 class 이름을 콘텐츠 데이터로 저장하지 않는다.
7. 모든 문서와 블록에는 버전과 안정적인 ID가 있어야 한다.

## 3. 권장 시스템 구성

```text
┌─────────────────────────────────────────────────────┐
│ React application                                   │
│                                                     │
│  /admin/projects/:slug/edit    /work/:slug          │
│  Block editor                  Project renderer     │
└───────────────┬───────────────────────┬─────────────┘
                │                       │
                └──────────┬────────────┘
                           │ HTTPS JSON API
┌──────────────────────────▼──────────────────────────┐
│ Content API                                         │
│                                                     │
│ Auth · validation · drafts · publishing · uploads   │
└──────────────┬───────────────────────┬──────────────┘
               │                       │
       ┌───────▼────────┐      ┌──────▼──────────────┐
       │ SQL database   │      │ Media storage       │
       │ documents      │      │ images / videos     │
       │ revisions      │      │ thumbnails          │
       │ asset metadata │      │                     │
       └────────────────┘      └─────────────────────┘
```

초기 배포 조합은 다음을 기준으로 한다.

- 프런트엔드: 현재 Vite/React 애플리케이션
- API: Cloudflare Workers
- 데이터베이스: Cloudflare D1
- 이미지 및 짧은 영상: Cloudflare R2
- 자동 인코딩이 필요한 영상: Cloudflare Stream
- 인증: 관리자 전용 세션 쿠키

서비스별 구현은 교체할 수 있어야 한다. 프런트엔드에서 D1이나 R2 SDK를 직접 사용하지 않는다.

## 4. 저장소 구조

서버 코드가 추가될 때 monorepo 형태로 전환한다.

```text
portfolio/
├── apps/
│   ├── web/                 # 현재 portfolio-react
│   │   └── src/
│   │       ├── editor/
│   │       ├── pages/
│   │       └── repositories/
│   └── api/
│       └── src/
│           ├── routes/
│           ├── services/
│           ├── repositories/
│           └── middleware/
├── packages/
│   └── content-schema/      # 문서 타입과 검증 규칙 공유
└── migrations/              # 데이터베이스 마이그레이션
```

초기 구현에서는 디렉터리 이동을 먼저 하지 않는다. 현재 앱 안에서 `content-schema`와 API를 검증한 후 monorepo로 이동한다.

## 5. 프로젝트 문서 스키마 v2

현재 v1 문서는 HTML 구조를 보존하기 때문에 에디터가 다루기 어렵다. v2는 의미 중심 블록만 허용한다.

```json
{
  "schemaVersion": 2,
  "projectId": "prj_01",
  "slug": "insight-renewal",
  "title": "유익하게 새로워진 비즈넵 인사이트",
  "excerpt": "인사이트의 정보 구조와 리포트 경험을 개선한 프로젝트",
  "coverAssetId": "ast_cover_01",
  "theme": {
    "accentColor": "#4c3fd3",
    "backgroundColor": "#f3f3ff",
    "textColor": "#121417"
  },
  "meta": [
    { "id": "meta_role", "label": "Role", "value": "Product Designer" },
    { "id": "meta_tools", "label": "Tools", "value": "Figma" },
    { "id": "meta_duration", "label": "Duration", "value": "2021.07 - 2021.10" }
  ],
  "blocks": [],
  "version": 1
}
```

### 5.1 초기 지원 블록

```text
heading      제목 1~3
paragraph    일반 본문과 인라인 marks
quote        강조 문장과 인용
bulletedList 순서 없는 목록
numberedList 순서 있는 목록
image        이미지, 대체 텍스트, 캡션
video        영상, 포스터, 재생 옵션
gallery      여러 이미지
columns      2열 콘텐츠
callout      강조 정보
divider      구분선
spacer       제한된 수직 간격
```

`rawHtml`, 임의 태그, 임의 script, 임의 style 속성은 v2 스키마에서 허용하지 않는다.

### 5.2 텍스트 블록

```json
{
  "id": "blk_intro_01",
  "type": "paragraph",
  "content": [
    { "type": "text", "text": "방문률이 ", "marks": [] },
    { "type": "text", "text": "8~10%", "marks": ["bold"] },
    { "type": "text", "text": "까지 감소했습니다.", "marks": [] }
  ],
  "align": "left"
}
```

허용하는 mark는 `bold`, `semibold`, `italic`, `underline`, `strike`, `code`, `link`로 제한한다.

### 5.3 이미지 블록

```json
{
  "id": "blk_image_01",
  "type": "image",
  "assetId": "ast_image_01",
  "alt": "개선된 인사이트 홈 화면",
  "caption": "사용자가 필요한 리포트를 더 빠르게 찾을 수 있도록 개선했다.",
  "layout": "wide"
}
```

`layout`은 `content`, `wide`, `full`만 허용한다.

### 5.4 영상 블록

```json
{
  "id": "blk_video_01",
  "type": "video",
  "assetId": "ast_video_01",
  "posterAssetId": "ast_poster_01",
  "caption": "프로토타입 인터랙션",
  "playback": {
    "controls": true,
    "autoplay": false,
    "muted": true,
    "loop": false
  },
  "layout": "wide"
}
```

## 6. 데이터베이스

### 6.1 projects

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  draft_document TEXT NOT NULL,
  published_document TEXT,
  draft_version INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);
```

`status`는 `draft`, `published`, `archived` 중 하나다. JSON 문서는 API 입출력 시 검증하고 DB에는 직렬화해 저장한다.

### 6.2 assets

```sql
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  provider TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  public_url TEXT,
  mime_type TEXT NOT NULL,
  original_name TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_seconds REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

`kind`은 `image`, `video`, `file`이고 `status`는 `pending`, `uploading`, `processing`, `ready`, `failed`, `deleted`다.

### 6.3 revisions

```sql
CREATE TABLE project_revisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  document TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE (project_id, version)
);
```

발행 시점과 수동 저장 시점에 revision을 만든다. 자동 저장마다 revision을 생성하지 않는다.

## 7. API 계약

프런트엔드는 `VITE_CONTENT_API_URL`이 설정되면 원격 repository를 사용하고,
설정되지 않으면 localStorage와 IndexedDB repository를 사용한다. API 요청에는
관리자 세션 쿠키를 전달하기 위해 `credentials: include`를 적용한다.

```bash
cp .env.example .env.local
# VITE_CONTENT_API_URL=https://content-api.example.com
```

원격 API는 에디터 origin을 허용하는 CORS 설정과 credential 허용이 필요하다.
초안 저장의 `409 Conflict`는 다른 탭 또는 기기에서 문서 버전이 변경되었다는
의미이며, 클라이언트가 최신 문서를 다시 읽은 후 충돌을 해결해야 한다.

### 7.0.1 로컬 Content API 실행

```bash
cp api/.dev.vars.example api/.dev.vars
npm run api:migrate:local
npm run api:dev
```

웹 앱의 `.env.local`에는 다음 주소를 지정한다.

```env
VITE_CONTENT_API_URL=http://localhost:8787
```

운영 배포 전에는 `api/wrangler.jsonc`의 D1 `database_id`를 실제 값으로
교체하고 `ADMIN_PASSWORD`, `SESSION_SECRET`, `UPLOAD_SECRET`을 Wrangler
secret으로 등록한다. `.dev.vars`와 실제 secret 값은 저장소에 커밋하지 않는다.

### 7.1 공개 API

```http
GET /api/public/projects
GET /api/public/projects/:slug
```

공개 API는 `published_document`만 반환한다.

### 7.2 관리자 프로젝트 API

```http
POST   /api/admin/session
DELETE /api/admin/session

GET    /api/admin/projects
POST   /api/admin/projects
GET    /api/admin/projects/:id
PATCH  /api/admin/projects/:id
POST   /api/admin/projects/:id/publish
POST   /api/admin/projects/:id/unpublish
GET    /api/admin/projects/:id/revisions
POST   /api/admin/projects/:id/revisions/:revisionId/restore
```

문서 저장 요청은 낙관적 잠금을 사용한다.

```json
{
  "expectedVersion": 12,
  "document": {}
}
```

서버 버전이 12가 아니면 `409 Conflict`를 반환한다. 다른 탭의 변경을 조용히 덮어쓰지 않는다.

### 7.3 업로드 API

```http
POST   /api/admin/uploads/init
POST   /api/admin/uploads/:assetId/complete
DELETE /api/admin/assets/:assetId
```

업로드 초기화 요청:

```json
{
  "projectId": "prj_01",
  "fileName": "insight-main.png",
  "mimeType": "image/png",
  "byteSize": 2840192
}
```

응답:

```json
{
  "assetId": "ast_01",
  "upload": {
    "method": "PUT",
    "url": "https://temporary-upload-url",
    "headers": {
      "Content-Type": "image/png"
    },
    "expiresAt": "2026-08-18T12:00:00Z"
  }
}
```

## 8. 미디어 업로드 흐름

```text
1. 사용자가 파일을 드롭한다.
2. 에디터가 로컬 object URL로 즉시 미리보기를 만든다.
3. API에 파일명, MIME, 크기를 전달한다.
4. API가 권한과 제한을 확인하고 asset row를 pending으로 만든다.
5. API가 짧은 만료시간의 업로드 URL을 반환한다.
6. 브라우저가 저장소에 파일을 직접 PUT한다.
7. 브라우저가 complete API를 호출한다.
8. API가 실제 객체의 존재와 크기를 확인한다.
9. 이미지 메타데이터 또는 영상 처리 상태를 기록한다.
10. asset이 ready가 되면 블록에 최종 URL을 표시한다.
```

이미지는 25MB 이하, 단일 PUT을 기본으로 한다. 큰 영상은 multipart 또는 영상 서비스의 재개 가능한 업로드를 사용한다.

업로드 실패 시 블록을 삭제하지 않고 `retry` 상태로 둔다. 문서에는 `ready`가 아닌 asset도 저장할 수 있지만 발행은 막는다.

## 9. 인증과 보안

- 관리자 회원가입 UI는 만들지 않는다.
- 초기 관리자 계정은 배포 환경의 secret으로 생성한다.
- 로그인 성공 시 `HttpOnly`, `Secure`, `SameSite=Lax` 세션 쿠키를 사용한다.
- 수정, 발행, 업로드 URL 발급은 모두 인증된 요청만 허용한다.
- 업로드 URL에는 파일 하나, HTTP 메서드 하나, MIME 타입 하나만 허용한다.
- 파일 확장자가 아니라 실제 MIME과 파일 시그니처를 검사한다.
- SVG는 초기 버전에서 업로드를 허용하지 않는다.
- 문서 렌더러는 임의 HTML을 실행하지 않는다.
- API에 CSRF 방어와 origin 검사를 적용한다.
- 관리자 로그인과 업로드 URL 발급에 rate limit을 적용한다.

## 10. 에디터 상태

```text
idle
editing
saving
saved
save-error
conflict
publishing
published
```

문서 변경 후 1초 동안 추가 입력이 없으면 자동 저장한다. 페이지를 닫을 때 저장 중이거나 오류가 있으면 경고한다.

에디터 내부 상태는 다음을 분리한다.

```text
documentState   블록과 프로젝트 메타
selectionState  커서와 선택 블록
historyState    undo/redo
uploadState     파일별 진행률과 실패 상태
saveState       버전, 저장 여부, 서버 오류
```

## 11. 초안, 미리보기, 발행

- 자동 저장은 `draft_document`만 변경한다.
- 미리보기 URL은 인증된 관리자에게 draft를 렌더링한다.
- 발행 전에 문서와 모든 asset을 검증한다.
- 발행 시 draft를 published에 복사하고 revision을 만든다.
- 공개 페이지는 published만 조회한다.
- 발행 후에도 draft는 별도로 계속 편집할 수 있다.

## 12. 현재 프로젝트의 전환 계획

### Phase 0 — 현재 상태

- 기존 HTML에서 hero/meta를 읽는다.
- 설명은 HTML 형태의 v1 JSON 블록으로 렌더링한다.
- `LegacyContent`와 `html-react-parser`에 의존한다.

### Phase 1 — 스키마 기반 렌더러

- v2 문서 타입과 validator를 추가한다.
- v2 전용 `ProjectRenderer`를 만든다.
- `heading`, `paragraph`, `image`, `video`, `columns`부터 지원한다.
- 프로젝트 하나를 v2로 수동 이전해 화면 일치를 검증한다.

완료 조건:

- 임의 HTML 없이 프로젝트 한 개가 정상 렌더링된다.
- 모바일과 데스크톱 레이아웃이 유지된다.
- 접근 가능한 heading 순서와 이미지 alt가 보장된다.

### Phase 2 — 로컬 에디터 MVP

- 서버 없이 브라우저에서 v2 문서를 편집한다.
- JSON 내보내기/가져오기를 지원한다.
- 블록 추가, 삭제, 이동, 텍스트 편집을 지원한다.
- 로컬 파일 미리보기까지 구현한다.

완료 조건:

- 새 프로젝트 문서를 에디터만으로 작성할 수 있다.
- 새로고침 전 undo/redo가 동작한다.
- 내보낸 JSON을 공개 렌더러가 그대로 표시한다.

### Phase 3 — API와 인증

- D1 schema와 migration을 추가한다.
- 관리자 로그인, 문서 CRUD, 자동 저장을 구현한다.
- JSON 파일 repository를 API repository로 교체한다.

완료 조건:

- 새로고침 후에도 초안이 유지된다.
- 비로그인 사용자는 관리자 API를 사용할 수 없다.
- 충돌하는 버전은 409로 보호된다.

### Phase 4 — 이미지 업로드

- R2 bucket과 CORS를 구성한다.
- presigned upload와 asset API를 구현한다.
- 진행률, 실패, 재시도, 삭제를 구현한다.

완료 조건:

- 이미지 드롭부터 블록 삽입까지 한 흐름으로 동작한다.
- 업로드 중 편집을 계속할 수 있다.
- 미사용 asset을 확인할 수 있다.

### Phase 5 — 영상 업로드

- 짧은 영상은 R2 direct upload를 지원한다.
- 큰 영상은 resumable upload를 지원한다.
- 필요하면 영상 provider adapter로 Stream을 추가한다.

완료 조건:

- 업로드 진행률과 처리 상태가 표시된다.
- 발행된 페이지에서 poster와 재생 옵션이 동작한다.
- 처리 실패 영상이 포함된 문서는 발행되지 않는다.

### Phase 6 — 전체 마이그레이션

- 기존 10개 프로젝트를 v2로 변환하고 검수한다.
- hero/meta도 v2 문서로 이동한다.
- `LegacyContent`, v1 JSON, 기존 HTML runtime import를 제거한다.
- 프로젝트별 lazy loading을 적용한다.

## 13. 첫 구현 범위

첫 번째 개발 범위는 Phase 1로 제한한다.

산출물:

```text
src/content/schema/
├── projectDocument.js
├── blockTypes.js
└── validateProjectDocument.js

src/components/project/
├── ProjectRenderer.jsx
└── blocks/
    ├── HeadingBlock.jsx
    ├── ParagraphBlock.jsx
    ├── ImageBlock.jsx
    ├── VideoBlock.jsx
    └── ColumnsBlock.jsx
```

검증 대상 프로젝트는 `1min-return` 하나로 시작한다. 이 단계에서는 서버, 로그인, 실제 업로드를 만들지 않는다. 문서 스키마와 렌더러가 안정된 뒤 에디터를 구현한다.

## 14. 의사결정 기록

### 문서를 JSON 한 덩어리로 저장하는 이유

블록 순서 변경과 초안 복원이 단순하고, 포트폴리오 규모에서는 문서 단위 읽기와 쓰기가 효율적이다. asset과 revision만 별도 테이블로 분리한다.

### 이미지 URL 대신 assetId를 저장하는 이유

도메인이나 저장 provider를 바꾸더라도 모든 문서를 수정할 필요가 없다. asset metadata에서 최종 URL을 해석한다.

### v1을 그대로 편집하지 않는 이유

v1은 HTML 태그와 class에 의존해 에디터가 유효한 조합을 보장하기 어렵다. v2는 렌더러가 허용된 시각 표현만 생성한다.

### 영상 provider를 추상화하는 이유

초기에는 R2의 MP4로 충분하지만, 향후 자동 인코딩과 adaptive streaming이 필요해질 수 있다. 문서는 provider 고유 URL이 아니라 assetId를 참조한다.
