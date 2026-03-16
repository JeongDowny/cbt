# CBT 프로젝트 전체 구조 및 기능 정리

## 개요
이 프로젝트는 **Next.js App Router + Supabase** 기반의 데스크톱 우선 CBT 웹 서비스입니다.

주요 사용자:
- 학생
- 관리자

주요 목적:
- 학생이 시험을 선택하고 문제를 풀이
- 자동 채점 후 결과 저장
- 저장된 결과를 `반 + 이름`으로 다시 조회
- 관리자가 시험과 반 정보를 관리

## 현재 구현된 주요 기능

### 학생 기능
- 홈 화면 진입
- 시험 선택
- 시험 옵션 설정
  - 시간 제한
  - 문제 랜덤
  - 문항 수
- 시험 풀이
- 문제별 손풀이 이미지 첨부
- 제출 시 `반 선택 + 이름` 입력
- 자동 채점
- 즉시 결과 보기
- `반 + 이름`으로 이전 결과 조회

### 관리자 기능
- 이메일/비밀번호 로그인
- 관리자 보호 라우트
- 시험 생성
- 시험 수정
- 세부 과목 단위 문항 편집
- 정답 선택
- 문제 이미지 업로드
- 해설 / 해설 영상 URL 입력
- 시험 삭제
- 반 관리
  - `연도 + 반 이름 + 기수` 조합 입력
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

라우트 상수는 [routes.ts](/Users/jeongdaun/source/cbt/src/lib/constants/routes.ts) 에서 관리합니다.

## 현재 페이지별 역할

### 1. 홈
파일:
- [page.tsx](/Users/jeongdaun/source/cbt/src/app/page.tsx)

역할:
- 서비스 소개
- `시험 선택`, `결과 조회` 빠른 진입
- 모바일에서는 관리자 안내 카드 숨김

### 2. 시험 선택
파일:
- [page.tsx](/Users/jeongdaun/source/cbt/src/app/exams/select/page.tsx)
- [exam-selection-form.tsx](/Users/jeongdaun/source/cbt/src/features/exams/components/exam-selection-form.tsx)

역할:
- 공개 시험 목록 조회
- 자격증/연도/회차 기준 선택
- 옵션 저장 후 풀이 화면 이동

관련 상태 저장:
- [exam-session.store.ts](/Users/jeongdaun/source/cbt/src/stores/exam-session.store.ts)

### 3. 시험 풀이
파일:
- [page.tsx](/Users/jeongdaun/source/cbt/src/app/exams/[examId]/solve/page.tsx)
- [exam-solving-runner.tsx](/Users/jeongdaun/source/cbt/src/features/exams/components/exam-solving-runner.tsx)
- [data.ts](/Users/jeongdaun/source/cbt/src/features/exams/data.ts)

역할:
- 문제/보기/이미지 렌더링
- 진행률 표시
- 시간 제한 처리
- 답안 선택
- 해설 영상 URL 확인
- 손풀이 이미지 첨부
- 손풀이 이미지 1MB 이하 자동 압축 후 스토리지 업로드
- 제출 시 `반 선택 + 이름` 입력

### 4. 결과 조회
파일:
- [page.tsx](/Users/jeongdaun/source/cbt/src/app/results/lookup/page.tsx)
- [result-lookup-form.tsx](/Users/jeongdaun/source/cbt/src/features/reports/components/result-lookup-form.tsx)

역할:
- `반 + 이름` 기준으로 저장된 결과 조회
- 결과 리스트 표시
- 상세 결과 페이지로 이동

### 5. 결과 상세
파일:
- [page.tsx](/Users/jeongdaun/source/cbt/src/app/results/[reportId]/page.tsx)

역할:
- 점수 / 합격 여부 표시
- 과목별 점수 표시
- `문항 리뷰 시작하기` 이후 문제풀이형 리뷰 화면 진입
- 내 답 / 정답 / 해설 / 해설 영상 / 손풀이 이미지 표시

### 6. 관리자 로그인
파일:
- [page.tsx](/Users/jeongdaun/source/cbt/src/app/admin/login/page.tsx)
- [admin-login-form.tsx](/Users/jeongdaun/source/cbt/src/features/admin/components/admin-login-form.tsx)

역할:
- Supabase Auth 기반 관리자 로그인

### 7. 관리자 대시보드
파일:
- [page.tsx](/Users/jeongdaun/source/cbt/src/app/admin/(protected)/dashboard/page.tsx)
- [actions.ts](/Users/jeongdaun/source/cbt/src/features/admin/actions.ts)

역할:
- 반 조합 생성/삭제
- 반별 응시 결과 보기
- 최근 시험 목록 보기
- 모바일에서는 직접 URL 접근만 가능하고, 학생 화면에서 진입 CTA는 숨김

### 8. 관리자 시험 생성 / 수정
파일:
- [page.tsx](/Users/jeongdaun/source/cbt/src/app/admin/(protected)/exams/new/page.tsx)
- [page.tsx](/Users/jeongdaun/source/cbt/src/app/admin/(protected)/exams/[examId]/edit/page.tsx)
- [admin-exam-editor-form.tsx](/Users/jeongdaun/source/cbt/src/features/admin/exams/components/admin-exam-editor-form.tsx)
- [actions.ts](/Users/jeongdaun/source/cbt/src/features/admin/exams/actions.ts)
- [data.ts](/Users/jeongdaun/source/cbt/src/features/admin/exams/data.ts)
- [types.ts](/Users/jeongdaun/source/cbt/src/features/admin/exams/types.ts)

역할:
- 시험 메타데이터 입력
- 세부 과목 추가/삭제
- 과목별 문항 추가/수정
- 정답 선택
- 이미지 업로드
- 해설/해설 영상 입력
- 공개 여부 설정
- 이름 확인 후 시험 삭제

## 폴더 구조 설명

### `src/app`
App Router 기준 페이지와 서버 액션이 있습니다.

주요 구성:
- `page.tsx`: 홈
- `layout.tsx`: 전역 레이아웃
- `actions/reports.ts`: 시험 제출/결과 조회 서버 액션
- `exams/*`: 학생 시험 플로우
- `results/*`: 결과 조회/상세
- `admin/*`: 관리자 로그인 및 보호 페이지

### `src/features`
도메인 기능별 코드가 모여 있습니다.

#### `features/exams`
- 학생 시험 선택/풀이 UI
- 시험 데이터 로딩
- 손풀이 이미지 압축 유틸

#### `features/reports`
- 결과 조회 UI
- 결과 DTO 타입

#### `features/admin`
- 관리자 로그인
- 반 관리 서버 액션
- 시험 생성/수정 로직

#### `features/classes`
- 반 옵션 라벨 생성
- 반 조합 조회

#### `features/layout`
- 공통 레이아웃 컴포넌트
- 전역 네비게이션
- 뒤로 가기 버튼
- `PageShell`

### `src/components/ui`
간단한 공통 UI 프리미티브

현재 포함:
- `button`
- `card`
- `input`
- `label`

### `src/lib`
공용 유틸과 설정

주요 파일:
- [routes.ts](/Users/jeongdaun/source/cbt/src/lib/constants/routes.ts)
- [env.ts](/Users/jeongdaun/source/cbt/src/lib/supabase/env.ts)
- [server.ts](/Users/jeongdaun/source/cbt/src/lib/supabase/server.ts)
- [client.ts](/Users/jeongdaun/source/cbt/src/lib/supabase/client.ts)
- [public.ts](/Users/jeongdaun/source/cbt/src/lib/supabase/public.ts)
- [storage.ts](/Users/jeongdaun/source/cbt/src/lib/supabase/storage.ts)
- [utils.ts](/Users/jeongdaun/source/cbt/src/lib/utils.ts)

### `src/stores`
- Zustand 기반 시험 세션 옵션 저장

### `src/types`
- Supabase 스키마 기반 타입 정의
- [database.ts](/Users/jeongdaun/source/cbt/src/types/database.ts)

### `supabase`
DB 기준 스키마와 마이그레이션 파일

주요 파일:
- [setup20260310.sql](/Users/jeongdaun/source/cbt/supabase/setup20260310.sql)
- [20260310_000004_promote_setup_schema.sql](/Users/jeongdaun/source/cbt/supabase/migrations/20260310_000004_promote_setup_schema.sql)
- [20260316_000005_add_explanation_video_url.sql](/Users/jeongdaun/source/cbt/supabase/migrations/20260316_000005_add_explanation_video_url.sql)
- [20260316_000006_add_class_groups_and_attempt_snapshots.sql](/Users/jeongdaun/source/cbt/supabase/migrations/20260316_000006_add_class_groups_and_attempt_snapshots.sql)
- [20260316_000007_add_attempt_work_image_snapshot.sql](/Users/jeongdaun/source/cbt/supabase/migrations/20260316_000007_add_attempt_work_image_snapshot.sql)

### `docs`
프로젝트 요구사항, 스타일, DB 구조 문서

현재 문서:
- [product-spec.md](/Users/jeongdaun/source/cbt/docs/product-spec.md)
- [style-guide.md](/Users/jeongdaun/source/cbt/docs/style-guide.md)
- [task-order.md](/Users/jeongdaun/source/cbt/docs/task-order.md)
- [db-erd.md](/Users/jeongdaun/source/cbt/docs/db-erd.md)
- [project-overview.md](/Users/jeongdaun/source/cbt/docs/project-overview.md)

## 현재 핵심 서버 액션

### 결과/응시 관련
파일:
- [reports.ts](/Users/jeongdaun/source/cbt/src/app/actions/reports.ts)

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
- [actions.ts](/Users/jeongdaun/source/cbt/src/features/admin/actions.ts)

포함 기능:
- 로그아웃
- 반 조합 추가/삭제

### 관리자 시험 관리
파일:
- [actions.ts](/Users/jeongdaun/source/cbt/src/features/admin/exams/actions.ts)

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

상세 관계 설명은 [db-erd.md](/Users/jeongdaun/source/cbt/docs/db-erd.md) 참고.

## 현재 UI 공통 구조

### 전역 네비게이션
파일:
- [global-navigation.tsx](/Users/jeongdaun/source/cbt/src/features/layout/components/global-navigation.tsx)

기능:
- `홈`
- `시험 시작하기`
- `결과 다시보기`
- 우측 관리자 버튼

추가 동작:
- 모바일에서는 관리자 버튼 숨김
- 학생용 주요 이동은 모바일에서도 그대로 노출

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

## 최근 주요 UX 반영 사항
- 결과 페이지는 점수 확인 후 `문항 리뷰 시작하기` 버튼을 눌러 리뷰를 시작하는 구조
- 리뷰 화면은 문제풀이 화면과 유사한 좌/우 구조
- 오답에서 내 선택은 빨간색, 정답은 초록색으로 표시
- 시험 풀이 화면은 모바일에서도 문제/현황/버튼이 무리 없이 보이도록 조정
- 관리자 관련 진입은 모바일 학생 화면에서 숨김 처리

### 페이지 공통 셸
파일:
- [page-shell.tsx](/Users/jeongdaun/source/cbt/src/features/layout/components/page-shell.tsx)

기능:
- 배지
- 제목
- 설명
- 뒤로 가기 버튼
- 헤더 액션
- 폭/정렬/밀도 제어

### 뒤로 가기 버튼
파일:
- [back-button.tsx](/Users/jeongdaun/source/cbt/src/features/layout/components/back-button.tsx)

동작:
- 브라우저 히스토리 우선
- 없으면 fallback 경로 이동

## 상태 관리

### Zustand
파일:
- [exam-session.store.ts](/Users/jeongdaun/source/cbt/src/stores/exam-session.store.ts)

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
  - [layout.tsx](/Users/jeongdaun/source/cbt/src/app/admin/(protected)/layout.tsx)

동작:
- 로그인 안 되어 있으면 `/admin/login`으로 리다이렉트

## Supabase 연결 방식

### 서버 전용
- [server.ts](/Users/jeongdaun/source/cbt/src/lib/supabase/server.ts)
- 쿠키 기반 서버 클라이언트
- 서비스 롤 클라이언트 별도 제공

### 브라우저 전용
- [client.ts](/Users/jeongdaun/source/cbt/src/lib/supabase/client.ts)

### 공개 데이터 조회
- [public.ts](/Users/jeongdaun/source/cbt/src/lib/supabase/public.ts)

## 필수 환경변수

파일:
- [env.ts](/Users/jeongdaun/source/cbt/src/lib/supabase/env.ts)

필수 값:
- `SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` 또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`

## 현재 구현 범위에서 주의할 점

### 1. 시험 결과 저장 기준
- 현재 학생 결과 저장/조회는 `반 + 이름` 기준입니다.
- 예전 `생년월일` 기반 데이터는 legacy 필드로만 남아 있습니다.

### 2. 이미지 버킷
- 문제 이미지는 Supabase Storage `question-images` 버킷 기준입니다.

### 3. 관리자 시험 수정
- 시험 수정은 과목/문항 중심 구조입니다.
- 기존 응시 데이터와 FK 충돌을 피하기 위해 과목을 통째로 단순 삭제하지 않도록 구현되어 있습니다.

### 4. 공통 헤더
- 전역 상단 네비게이션이 모든 화면에 공통 적용됩니다.
- 관리자 보호 레이아웃은 별도 상단 헤더를 두지 않습니다.

## 문서를 읽는 추천 순서

1. [project-overview.md](/Users/jeongdaun/source/cbt/docs/project-overview.md)
2. [product-spec.md](/Users/jeongdaun/source/cbt/docs/product-spec.md)
3. [style-guide.md](/Users/jeongdaun/source/cbt/docs/style-guide.md)
4. [db-erd.md](/Users/jeongdaun/source/cbt/docs/db-erd.md)
5. 필요 시 `src/features/*`, `src/app/*`, `supabase/*`
