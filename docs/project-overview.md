# CBT 프로젝트 전체 구조 및 기능 정리

## 개요
이 프로젝트는 **Next.js App Router + Supabase** 기반의 데스크톱 우선 CBT 웹 서비스입니다.

현재 서비스는 단순 시험 풀이 사이트를 넘어, **학원 반 단위 숙제/응시 관리**까지 고려한 구조로 확장되어 있습니다.

주요 사용자:
- 학생
- 관리자

주요 목적:
- 학생이 시험을 선택하고 문제를 풀이
- 자동 채점 후 결과 저장
- 저장된 결과를 `반 + 이름` 기준으로 다시 조회
- 관리자가 시험, 문항, 반 정보를 관리
- 반별 응시 결과를 확인

## 현재 구현된 핵심 기능

### 학생 기능
- 홈 화면 진입
- 시험 선택
- 시험 옵션 설정
  - 시간 제한
  - 문제 랜덤
  - 문항 수
- 시험 풀이
- 답안 선택 시 자동 다음 문항 이동
- 문제 이미지 표시
- 해설 영상 URL 표시
- 문제별 손풀이 이미지 첨부
- 손풀이 이미지 1MB 이하 자동 압축 후 Supabase Storage 업로드
- 제출 시 `반 선택 + 이름` 입력
- 자동 채점
- 즉시 결과 보기
- `반 + 이름` 기준 이전 결과 조회
- 결과 상세에서 `문항 리뷰 시작하기` 후 문제풀이형 리뷰 진행

### 관리자 기능
- 이메일/비밀번호 로그인
- 관리자 보호 라우트
- 시험 생성
- 시험 수정
- 세부 과목 단위 문항 편집
- 4지선다 / 5지선다 정답 선택
- 문제 이미지 업로드
- 해설 / 해설 영상 URL 입력
- 시험 삭제
- 반 조합 생성/삭제
  - `연도 + 반 이름 + 기수`를 한 번에 입력해 생성
- 반별 응시 결과 조회

## 라우트 구조

### 공용 페이지
- `/`
  - 홈
- `/exams/select`
  - 시험 선택 화면
- `/exams/[examId]/solve`
  - 시험 풀이 화면
- `/results/lookup`
  - 결과 조회 화면
- `/results/[reportId]`
  - 결과 상세 화면

### 관리자 페이지
- `/admin/login`
  - 관리자 로그인
- `/admin/dashboard`
  - 관리자 대시보드
- `/admin/exams/new`
  - 새 시험 등록
- `/admin/exams/[examId]/edit`
  - 시험 수정

라우트 상수는 [src/lib/constants/routes.ts](../src/lib/constants/routes.ts)에서 관리합니다.

## 현재 페이지별 역할

### 1. 홈
파일:
- [src/app/page.tsx](../src/app/page.tsx)

역할:
- 서비스 소개
- `시험 선택`, `결과 조회` 빠른 진입
- 모바일에서는 관리자 진입 CTA 숨김

### 2. 시험 선택
파일:
- [src/app/exams/select/page.tsx](../src/app/exams/select/page.tsx)
- [src/features/exams/components/exam-selection-form.tsx](../src/features/exams/components/exam-selection-form.tsx)
- [src/stores/exam-session.store.ts](../src/stores/exam-session.store.ts)

역할:
- 공개 시험 목록 조회
- 자격증/연도/회차 기준 선택
- 시험 옵션 저장
- 풀이 화면으로 이동

### 3. 시험 풀이
파일:
- [src/app/exams/[examId]/solve/page.tsx](../src/app/exams/[examId]/solve/page.tsx)
- [src/features/exams/components/exam-solving-runner.tsx](../src/features/exams/components/exam-solving-runner.tsx)
- [src/features/exams/data.ts](../src/features/exams/data.ts)

역할:
- 시험 풀이 전체 오케스트레이션
- 문제/보기/이미지 렌더링
- 진행률 표시
- 시간 제한 처리
- 답안 선택
- 손풀이 이미지 첨부
- 제출 시 `반 선택 + 이름` 입력

리팩토링 후 내부 분리:
- 질문/이동 상태: [src/features/exams/hooks/use-exam-question-flow.ts](../src/features/exams/hooks/use-exam-question-flow.ts)
- 타이머 상태: [src/features/exams/hooks/use-exam-timer.ts](../src/features/exams/hooks/use-exam-timer.ts)
- 손풀이 이미지 업로드/세션 상태: [src/features/exams/hooks/use-attempt-work-images.ts](../src/features/exams/hooks/use-attempt-work-images.ts)
- 문제 본문 패널: [src/features/exams/components/exam-question-panel.tsx](../src/features/exams/components/exam-question-panel.tsx)
- 진행 현황 패널: [src/features/exams/components/exam-progress-panel.tsx](../src/features/exams/components/exam-progress-panel.tsx)
- 제출 정보 입력: [src/features/exams/components/exam-submission-form.tsx](../src/features/exams/components/exam-submission-form.tsx)

### 4. 결과 조회
파일:
- [src/app/results/lookup/page.tsx](../src/app/results/lookup/page.tsx)
- [src/features/reports/components/result-lookup-form.tsx](../src/features/reports/components/result-lookup-form.tsx)

역할:
- `반 + 이름` 기준 저장된 결과 조회
- 결과 리스트 표시
- 결과 상세 페이지로 이동

### 5. 결과 상세
파일:
- [src/app/results/[reportId]/page.tsx](../src/app/results/[reportId]/page.tsx)
- [src/features/reports/components/result-review-runner.tsx](../src/features/reports/components/result-review-runner.tsx)

역할:
- 통합 점수 / 과목별 점수 표시
- `문항 리뷰 시작하기` 버튼 노출
- 리뷰 시작 후 문제풀이형 레이아웃으로 전환
- 내 답 / 정답 / 해설 / 해설 영상 / 손풀이 이미지 표시

### 6. 관리자 로그인
파일:
- [src/app/admin/login/page.tsx](../src/app/admin/login/page.tsx)
- [src/features/admin/components/admin-login-form.tsx](../src/features/admin/components/admin-login-form.tsx)

역할:
- Supabase Auth 기반 관리자 로그인

### 7. 관리자 대시보드
파일:
- [src/app/admin/(protected)/dashboard/page.tsx](../src/app/admin/(protected)/dashboard/page.tsx)
- [src/features/admin/dashboard/data.ts](../src/features/admin/dashboard/data.ts)
- [src/features/admin/components/admin-class-group-manager.tsx](../src/features/admin/components/admin-class-group-manager.tsx)
- [src/features/admin/components/admin-attempt-groups.tsx](../src/features/admin/components/admin-attempt-groups.tsx)
- [src/features/admin/components/admin-exam-list-section.tsx](../src/features/admin/components/admin-exam-list-section.tsx)

역할:
- 반 조합 생성/삭제
- 반별 응시 결과 보기
- 최근 시험 목록 보기
- 관리자용 보조 액션 제공

리팩토링 후 원칙:
- 페이지는 데이터 fetch와 섹션 조립만 수행
- grouped 결과 계산과 조회는 `features/admin/dashboard/data.ts`에서 처리

### 8. 관리자 시험 생성 / 수정
파일:
- [src/app/admin/(protected)/exams/new/page.tsx](../src/app/admin/(protected)/exams/new/page.tsx)
- [src/app/admin/(protected)/exams/[examId]/edit/page.tsx](../src/app/admin/(protected)/exams/[examId]/edit/page.tsx)
- [src/features/admin/exams/components/admin-exam-editor-form.tsx](../src/features/admin/exams/components/admin-exam-editor-form.tsx)
- [src/features/admin/exams/actions.ts](../src/features/admin/exams/actions.ts)
- [src/features/admin/exams/data.ts](../src/features/admin/exams/data.ts)
- [src/features/admin/exams/types.ts](../src/features/admin/exams/types.ts)

역할:
- 시험 메타데이터 입력
- 세부 과목 추가/삭제
- 과목별 문항 추가/수정
- 정답 선택
- 이미지 업로드
- 해설/해설 영상 입력
- 공개 여부 설정
- 이름 확인 후 시험 삭제

리팩토링 후 내부 분리:
- 기본 시험 정보: [src/features/admin/exams/components/admin-exam-basic-fields.tsx](../src/features/admin/exams/components/admin-exam-basic-fields.tsx)
- 과목 카드: [src/features/admin/exams/components/admin-exam-subject-card.tsx](../src/features/admin/exams/components/admin-exam-subject-card.tsx)
- 문항 카드: [src/features/admin/exams/components/admin-exam-question-card.tsx](../src/features/admin/exams/components/admin-exam-question-card.tsx)
- 삭제 액션 바: [src/features/admin/exams/components/admin-exam-delete-bar.tsx](../src/features/admin/exams/components/admin-exam-delete-bar.tsx)
- 폼 템플릿: [src/features/admin/exams/form-templates.ts](../src/features/admin/exams/form-templates.ts)
- 이미지 업로드 훅: [src/features/admin/exams/hooks/use-question-image-upload.ts](../src/features/admin/exams/hooks/use-question-image-upload.ts)

## 폴더 구조 설명

### `src/app`
App Router 기준 페이지와 서버 액션의 얇은 엔트리 레이어입니다.

주요 구성:
- `page.tsx`: 홈
- `layout.tsx`: 전역 레이아웃
- `actions/reports.ts`: 결과/응시 액션 공개 엔트리
- `exams/*`: 학생 시험 플로우 진입 페이지
- `results/*`: 결과 조회/상세 페이지
- `admin/*`: 관리자 로그인 및 보호 페이지

원칙:
- `page.tsx`는 가능한 한 데이터 로딩 결과를 UI에 전달하는 역할만 담당
- 큰 비즈니스 로직은 `src/features/*`로 이동

### `src/features`
도메인 기능별 코드가 모인 핵심 레이어입니다.

#### `features/exams`
학생 시험 선택/풀이 기능

구성:
- `components/`
  - 시험 선택/풀이 UI
  - 풀이 패널 분리 컴포넌트
- `hooks/`
  - 문항 이동
  - 타이머
  - 손풀이 이미지 업로드/세션 동기화
- `data.ts`
  - 시험/문항 조회 + view model 매핑
- `types.ts`
  - 풀이 UI 상태 타입과 view model 타입
- `utils/compress-image.ts`
  - 손풀이 이미지 1MB 자동 압축

#### `features/reports`
결과 저장/조회와 결과 리뷰 기능

구성:
- `components/`
  - 결과 조회 폼
  - 결과 리뷰 러너
- `server/`
  - 제출 저장
  - 결과 조회
  - 손풀이 이미지 업로드/삭제
  - mapper
  - admin client
- `types.ts`
  - 결과 view model 타입

원칙:
- `src/app/actions/reports.ts`는 공개 엔트리만 담당
- 실제 서버 로직은 `features/reports/server/*`로 분리

#### `features/admin`
관리자 인증, 반 관리, 시험 관리 기능

구성:
- `components/`
  - 관리자 로그인
  - 반별 결과 그룹 UI
  - 반 관리 UI
  - 시험 목록 UI
- `dashboard/data.ts`
  - 대시보드용 조회/그룹핑
- `actions.ts`
  - 반 조합 추가/삭제
  - 로그아웃
- `exams/`
  - 시험 생성/수정 전용 폴더
  - 편집 form/container, 세부 카드 UI, 업로드 훅, data/action/type 분리

#### `features/classes`
반 옵션 관련 데이터 처리

구성:
- [src/features/classes/data.ts](../src/features/classes/data.ts)
- [src/features/classes/types.ts](../src/features/classes/types.ts)

역할:
- 반 조합 조회
- 학생/결과 조회 화면에 표시할 라벨 생성

#### `features/layout`
공통 레이아웃과 네비게이션

주요 파일:
- [src/features/layout/components/global-navigation.tsx](../src/features/layout/components/global-navigation.tsx)
- [src/features/layout/components/page-shell.tsx](../src/features/layout/components/page-shell.tsx)
- [src/features/layout/components/back-button.tsx](../src/features/layout/components/back-button.tsx)

### `src/components/ui`
공통 UI 프리미티브입니다.

현재 포함:
- `button`
- `card`
- `input`
- `label`

### `src/lib`
공용 유틸과 Supabase 설정입니다.

주요 파일:
- [src/lib/constants/routes.ts](../src/lib/constants/routes.ts)
- [src/lib/supabase/env.ts](../src/lib/supabase/env.ts)
- [src/lib/supabase/server.ts](../src/lib/supabase/server.ts)
- [src/lib/supabase/client.ts](../src/lib/supabase/client.ts)
- [src/lib/supabase/public.ts](../src/lib/supabase/public.ts)
- [src/lib/supabase/storage.ts](../src/lib/supabase/storage.ts)
- [src/lib/utils.ts](../src/lib/utils.ts)

### `src/stores`
Zustand 기반 시험 세션 옵션 저장소입니다.

주요 파일:
- [src/stores/exam-session.store.ts](../src/stores/exam-session.store.ts)

### `src/types`
Supabase 스키마 기반 타입 정의입니다.

주요 파일:
- [src/types/database.ts](../src/types/database.ts)

원칙:
- DB row shape는 여기서만 기준을 잡고
- feature layer는 직접 row 타입을 노출하지 않도록 정리

### `supabase`
DB 기준 스키마와 마이그레이션 파일입니다.

주요 파일:
- [supabase/setup20260310.sql](../supabase/setup20260310.sql)
- [supabase/migrations/20260310_000004_promote_setup_schema.sql](../supabase/migrations/20260310_000004_promote_setup_schema.sql)
- [supabase/migrations/20260316_000005_add_explanation_video_url.sql](../supabase/migrations/20260316_000005_add_explanation_video_url.sql)
- [supabase/migrations/20260316_000006_add_class_groups_and_attempt_snapshots.sql](../supabase/migrations/20260316_000006_add_class_groups_and_attempt_snapshots.sql)
- [supabase/migrations/20260316_000007_add_attempt_work_image_snapshot.sql](../supabase/migrations/20260316_000007_add_attempt_work_image_snapshot.sql)

### `docs`
요구사항, 스타일, DB 구조, 프로젝트 개요 문서입니다.

현재 문서:
- [docs/product-spec.md](./product-spec.md)
- [docs/style-guide.md](./style-guide.md)
- [docs/task-order.md](./task-order.md)
- [docs/db-erd.md](./db-erd.md)
- [docs/project-overview.md](./project-overview.md)

## 현재 핵심 서버 액션

### 결과/응시 관련
공개 엔트리:
- [src/app/actions/reports.ts](../src/app/actions/reports.ts)

실제 구현:
- [src/features/reports/server/attempt-submit.ts](../src/features/reports/server/attempt-submit.ts)
- [src/features/reports/server/attempt-lookup.ts](../src/features/reports/server/attempt-lookup.ts)
- [src/features/reports/server/attempt-work-images.ts](../src/features/reports/server/attempt-work-images.ts)
- [src/features/reports/server/report-mappers.ts](../src/features/reports/server/report-mappers.ts)

포함 기능:
- `submitAttemptAction`
  - 시험 제출 저장
  - `attempts`, `attempt_subjects`, `attempt_answers` 생성
  - 손풀이 이미지 경로 snapshot 저장
  - `finalize_attempt` 호출
- `uploadAttemptWorkImageAction`
  - 손풀이 이미지 업로드
- `deleteAttemptWorkImageAction`
  - 손풀이 이미지 삭제
- `getAttemptReportAction`
  - 결과 상세 조회
- `lookupAttemptsAction`
  - `반 + 이름` 기준 결과 조회

### 관리자 반 관리
파일:
- [src/features/admin/actions.ts](../src/features/admin/actions.ts)

포함 기능:
- 로그아웃
- 반 조합 추가/삭제

### 관리자 시험 관리
파일:
- [src/features/admin/exams/actions.ts](../src/features/admin/exams/actions.ts)

포함 기능:
- 문제 이미지 업로드
- 시험 저장
- 시험 삭제

## 데이터 구조 요약

현재 DB는 다음 축으로 구성됩니다.

### 시험 축
- `certifications`
- `exams`
- `exam_subjects`
- `questions`
- `question_images`

### 반 축
- `class_years`
- `class_names`
- `class_cohorts`
- `class_groups`

### 응시 축
- `attempts`
- `attempt_subjects`
- `attempt_answers`
- `attempt_deletion_logs`

상세 관계 설명은 [docs/db-erd.md](./db-erd.md)를 참고합니다.

## 현재 UI 공통 구조

### 전역 네비게이션
파일:
- [src/features/layout/components/global-navigation.tsx](../src/features/layout/components/global-navigation.tsx)

기능:
- `홈`
- `시험 시작하기`
- `결과 다시보기`
- 우측 관리자 버튼

추가 동작:
- 모바일에서는 관리자 버튼 숨김
- 학생용 주요 이동은 모바일에서도 유지

### 페이지 공통 셸
파일:
- [src/features/layout/components/page-shell.tsx](../src/features/layout/components/page-shell.tsx)

기능:
- 배지
- 제목
- 설명
- 뒤로 가기 버튼
- 헤더 액션
- 폭/정렬/밀도 제어

### 뒤로 가기 버튼
파일:
- [src/features/layout/components/back-button.tsx](../src/features/layout/components/back-button.tsx)

동작:
- 브라우저 히스토리 우선
- 히스토리가 없으면 fallback 경로 이동

## 상태 관리

### Zustand
파일:
- [src/stores/exam-session.store.ts](../src/stores/exam-session.store.ts)

저장 값:
- `examId`
- `timeLimitMinutes`
- `randomOrder`
- `questionCount`

용도:
- 시험 선택 화면에서 정한 옵션을 풀이 화면으로 전달

## 인증 구조

### 학생
- 로그인 없음

### 관리자
- Supabase Auth 로그인
- 보호 레이아웃:
  - [src/app/admin/(protected)/layout.tsx](../src/app/admin/(protected)/layout.tsx)

동작:
- 로그인되지 않으면 `/admin/login`으로 리다이렉트

## Supabase 연결 방식

### 서버 전용
- [src/lib/supabase/server.ts](../src/lib/supabase/server.ts)
- 쿠키 기반 서버 클라이언트
- 서비스 롤 클라이언트 별도 제공

### 브라우저 전용
- [src/lib/supabase/client.ts](../src/lib/supabase/client.ts)

### 공개 데이터 조회
- [src/lib/supabase/public.ts](../src/lib/supabase/public.ts)

## 스토리지 구조

### 문제 이미지
- 버킷: `question-images`
- 용도: 관리자 문항 이미지 업로드

### 손풀이 이미지
- 버킷: `attempt-work-images`
- 용도: 학생이 풀이 중 첨부하는 손풀이 이미지
- 특징:
  - 업로드 전 브라우저에서 1MB 이하로 자동 압축
  - 제출 후 결과 리뷰에서 다시 표시

## 필수 환경변수

파일:
- [src/lib/supabase/env.ts](../src/lib/supabase/env.ts)

필수 값:
- `SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` 또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`

## 현재 구현 범위에서 주의할 점

### 1. 결과 저장 기준
- 현재 학생 결과 저장/조회는 `반 + 이름` 기준입니다.
- 예전 `생년월일` 기반 데이터는 legacy 필드로만 남아 있습니다.

### 2. 시험 풀이 컨테이너
- [src/features/exams/components/exam-solving-runner.tsx](../src/features/exams/components/exam-solving-runner.tsx)는 오케스트레이션 전용으로 줄어든 상태입니다.
- 상세 상호작용 수정이 필요하면 먼저 `hooks/`와 패널 컴포넌트를 확인하는 것이 좋습니다.

### 3. 결과 서버 액션
- `reports` 관련 공개 함수는 `src/app/actions/reports.ts`를 통해 그대로 호출할 수 있습니다.
- 실제 수정은 `src/features/reports/server/*`에서 수행하는 구조입니다.

### 4. 관리자 시험 수정
- 시험 수정은 과목/문항 중심 구조입니다.
- 기존 응시 데이터와 FK 충돌을 피하기 위해 과목을 통째로 단순 삭제하지 않도록 구현되어 있습니다.

### 5. 공통 헤더
- 전역 상단 네비게이션이 모든 화면에 공통 적용됩니다.
- 관리자 보호 레이아웃은 별도 상단 헤더를 두지 않습니다.

## 문서를 읽는 추천 순서

1. [docs/project-overview.md](./project-overview.md)
2. [docs/product-spec.md](./product-spec.md)
3. [docs/style-guide.md](./style-guide.md)
4. [docs/db-erd.md](./db-erd.md)
5. 필요 시 `src/features/*`, `src/app/*`, `supabase/*`
