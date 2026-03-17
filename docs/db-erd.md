# CBT 데이터베이스 ERD 정리

## 개요
현재 DB는 크게 아래 4개 축으로 나뉩니다.

1. 시험 메타데이터
2. 문항/이미지
3. 반/기수 관리
4. 학생 응시 결과

학생은 로그인 없이 시험을 풀고, 제출 시 `반 + 이름` 기준으로 결과가 저장됩니다.  
관리자는 시험과 반 정보를 관리하고, 반별 응시 결과를 확인합니다.

이 문서는 **현재 실제 스키마와 저장 흐름** 기준으로 정리되어 있습니다.

## 전체 관계 요약

```text
certifications
  └─ exams
      └─ exam_subjects
          └─ questions
              └─ question_images

class_years
class_names
class_cohorts
  └─ class_groups
      └─ attempts
          └─ attempt_subjects
              └─ attempt_answers

exams
  └─ attempts
```

## 1. 시험 메타데이터 축

### `certifications`
자격증 이름 마스터입니다.

예시:
- `전기기사 필기`
- `전기산업기사 필기`

주요 컬럼:
- `id`
- `name`
- `created_at`
- `updated_at`

역할:
- 시험을 자격증 단위로 묶는 최상위 기준

### `exams`
실제 시험 회차 정보입니다.  
하나의 자격증 아래 여러 회차가 생성됩니다.

주요 컬럼:
- `id`
- `certification_id`
- `exam_year`
- `exam_round`
- `title`
- `status`
- `is_public`
- `created_at`
- `updated_at`

관계:
- `certifications (1) -> exams (N)`

운영 포인트:
- `title`은 스키마에서 생성되는 값입니다.
- `status`는 `draft`, `published`, `archived` 중 하나입니다.
- 학생 시험 선택 화면에는 보통 `published + is_public = true` 조건의 시험이 노출됩니다.

### `exam_subjects`
시험 안의 세부 과목입니다.

예시:
- `전기자기학`
- `전력공학`
- `전기기기`

주요 컬럼:
- `id`
- `exam_id`
- `subject_order`
- `name`
- `time_limit_minutes`
- `created_at`
- `updated_at`

관계:
- `exams (1) -> exam_subjects (N)`

운영 포인트:
- `subject_order`로 시험/결과 화면에서 과목 순서를 유지합니다.
- `attempt_subjects.exam_subject_id` FK가 연결되어 있으므로, 이미 응시 기록이 있는 과목은 무작정 삭제하면 안 됩니다.

## 2. 문항 / 이미지 축

### `questions`
실제 문제 본문, 보기, 정답, 해설을 저장합니다.

주요 컬럼:
- `id`
- `exam_subject_id`
- `question_no`
- `stem`
- `choice_1`
- `choice_2`
- `choice_3`
- `choice_4`
- `correct_answer`
- `explanation`
- `explanation_video_url`
- `created_at`
- `updated_at`

관계:
- `exam_subjects (1) -> questions (N)`

운영 포인트:
- 현재 스키마는 **4지선다 컬럼 구조**입니다.
- `question_no`로 문항 순서를 유지합니다.
- `explanation_video_url`은 결과 리뷰와 시험 풀이 화면에서 참고 링크로 사용됩니다.

### `question_images`
문제 이미지 경로를 저장합니다.  
실제 파일은 Supabase Storage에 있고, DB에는 경로만 저장합니다.

주요 컬럼:
- `id`
- `question_id`
- `image_order`
- `image_path`
- `created_at`

관계:
- `questions (1) -> question_images (N)`

스토리지:
- 버킷: `question-images`

운영 포인트:
- 문항당 여러 이미지를 순서대로 붙일 수 있습니다.
- 렌더링 시에는 `image_order` 기준으로 정렬해서 표시합니다.

## 3. 반 / 기수 관리 축

### `class_years`
사용 가능한 연도 목록입니다.

예시:
- `2026`
- `2027`

주요 컬럼:
- `id`
- `year`
- `created_at`
- `updated_at`

### `class_names`
사용 가능한 반 이름 목록입니다.

예시:
- `전기A반`
- `전기B반`

주요 컬럼:
- `id`
- `name`
- `created_at`
- `updated_at`

### `class_cohorts`
사용 가능한 기수 목록입니다.

예시:
- `1`
- `2`
- `3`

주요 컬럼:
- `id`
- `cohort_no`
- `created_at`
- `updated_at`

### `class_groups`
학생이 실제로 선택하는 반 조합입니다.

구성:
- `연도 + 반 이름 + 기수`

주요 컬럼:
- `id`
- `class_year_id`
- `class_name_id`
- `class_cohort_id`
- `created_at`
- `updated_at`

관계:
- `class_years (1) -> class_groups (N)`
- `class_names (1) -> class_groups (N)`
- `class_cohorts (1) -> class_groups (N)`

운영 포인트:
- 학생 화면에서는 3개를 따로 보여주지 않고 `2026-1 전기A반` 같은 **합쳐진 단일 옵션**으로 노출합니다.
- 관리자 대시보드에서는 이 조합을 직접 생성/삭제합니다.
- 마스터 테이블을 쪼개 둔 이유는 중복 입력을 줄이고 반 조합을 안정적으로 재사용하기 위해서입니다.

## 4. 학생 응시 결과 축

### `attempts`
학생의 1회 응시 전체 기록입니다.

주요 컬럼:
- `id`
- `exam_id`
- `class_group_id`
- `class_year_snapshot`
- `class_name_snapshot`
- `cohort_no_snapshot`
- `user_name`
- `birth_date`
- `started_at`
- `submitted_at`
- `status`
- `total_score`
- `passed`
- `created_at`
- `updated_at`

관계:
- `exams (1) -> attempts (N)`
- `class_groups (1) -> attempts (N)`

현재 저장 기준:
- `class_group_id + user_name`

운영 포인트:
- `birth_date`는 legacy 호환용으로만 남아 있습니다.
- 현재 학생 저장/조회 UI는 `반 + 이름` 기준입니다.
- `class_year_snapshot`, `class_name_snapshot`, `cohort_no_snapshot`은 응시 당시 반 정보를 고정하기 위한 컬럼입니다.

왜 snapshot을 남기나:
- 나중에 반 이름이 바뀌거나 마스터 데이터가 정리되어도
- 기존 응시 결과에는 당시 반 정보가 그대로 남아야 하기 때문입니다.

관련 트리거:
- `set_attempt_class_snapshot()`
  - `class_group_id`를 기준으로 snapshot 3개를 자동 채움

### `attempt_subjects`
응시 결과를 과목 단위로 나눈 기록입니다.

주요 컬럼:
- `id`
- `attempt_id`
- `exam_subject_id`
- `subject_name_snapshot`
- `started_at`
- `ended_at`
- `submitted_at`
- `score`
- `passed`
- `created_at`
- `updated_at`

관계:
- `attempts (1) -> attempt_subjects (N)`
- `exam_subjects (1) -> attempt_subjects (N)`

운영 포인트:
- 결과 상세 화면의 과목별 점수는 이 테이블 기준으로 계산/표시됩니다.
- `subject_name_snapshot`을 남겨 과목명이 바뀌어도 기존 결과 화면이 깨지지 않게 합니다.

관련 트리거:
- `validate_attempt_subjects()`
  - `attempt`와 `exam_subject`가 같은 시험 소속인지 검증
  - `subject_name_snapshot`이 비어 있으면 자동 보정

### `attempt_answers`
각 과목 안의 문항별 응답 스냅샷입니다.

주요 컬럼:
- `id`
- `attempt_subject_id`
- `question_id`
- `question_no`
- `subject_name_snapshot`
- `stem_snapshot`
- `choice_1_snapshot`
- `choice_2_snapshot`
- `choice_3_snapshot`
- `choice_4_snapshot`
- `correct_answer_snapshot`
- `explanation_snapshot`
- `explanation_video_url_snapshot`
- `image_paths_snapshot`
- `work_image_path_snapshot`
- `selected_answer`
- `is_correct`
- `answered_at`
- `created_at`

관계:
- `attempt_subjects (1) -> attempt_answers (N)`
- `questions (1) -> attempt_answers (N, nullable snapshot 참조)`

왜 문항 snapshot을 남기나:
- 시험 문항이 나중에 수정되어도
- 예전 응시 결과는 당시 기준 문항/보기/정답/해설을 그대로 보여줘야 하기 때문입니다.

관련 트리거:
- `set_attempt_answer_correctness()`
  - `selected_answer`와 `correct_answer_snapshot`을 비교해 `is_correct`를 자동 계산

### 손풀이 이미지 저장 방식
학생이 문제 풀이 중 첨부하는 손풀이 이미지는 별도 공개 버킷에 저장됩니다.

스토리지:
- 버킷: `attempt-work-images`

업로드 경로 형식:
- `draft-attempts/{clientDraftId}/{questionId}/{uuid}-{filename}`

DB 저장 위치:
- `attempt_answers.work_image_path_snapshot`

운영 포인트:
- 브라우저에서 업로드 전에 1MB 이하로 자동 압축합니다.
- 제출 시 문항별 경로를 `attempt_answers`에 snapshot으로 저장합니다.
- 결과 리뷰 화면에서는 이 snapshot 경로를 다시 public URL로 바꿔 손풀이 이미지를 표시합니다.

왜 별도 snapshot 경로를 남기나:
- 결과 리뷰 화면에서 당시 손풀이 이미지를 다시 보여주기 위해서입니다.
- 시험 풀이 중 이미지 교체/삭제가 있어도 제출 시점 기준 이미지를 고정할 수 있습니다.

### `attempt_deletion_logs`
응시 결과 삭제 시 백업 스냅샷을 남기는 테이블입니다.

주요 컬럼:
- `id`
- `attempt_id`
- `deleted_at`
- `deleted_by`
- `reason`
- `attempt_snapshot`

역할:
- 관리자 삭제나 정리 작업 시 원본 응시 기록 복구 근거 보존

## 실제 저장 흐름

### 시험 생성
1. 관리자가 자격증/연도/회차를 등록
2. 세부 과목을 추가
3. 각 과목에 문항, 정답, 해설, 해설 영상, 이미지 경로를 저장

### 반 조합 생성
1. 관리자가 `연도 + 반 이름 + 기수`를 한 번에 입력
2. 내부적으로 `class_years`, `class_names`, `class_cohorts`를 upsert
3. 최종 조합은 `class_groups`에 저장
4. 학생은 이 조합을 하나의 반 옵션으로 선택

### 시험 제출
1. 학생이 시험 풀이 완료
2. 손풀이 이미지는 브라우저에서 자동 압축 후 `attempt-work-images` 버킷에 즉시 업로드
3. 제출 시 `반 + 이름` 입력
4. `attempts` 생성
5. `attempt_subjects` 생성
6. `attempt_answers` 생성
7. 문항/보기/정답/해설/해설 영상/이미지 경로/손풀이 이미지 경로를 snapshot으로 저장
8. `finalize_attempt()` 함수가 과목 점수/총점/합격 여부를 계산

### 결과 조회
1. 학생이 `반 + 이름`으로 조회
2. `attempts`에서 일치하는 기록 검색
3. 상세 페이지에서 먼저 통합 점수와 과목별 점수 표시
4. `문항 리뷰 시작하기` 이후 `attempt_subjects`, `attempt_answers` snapshot 기반 리뷰 표시
5. 손풀이 이미지와 해설 영상 URL도 다시 확인 가능

## 현재 설계의 장점
- 학생 로그인 없이도 반 기준 결과 조회 가능
- 관리자 입장에서 반별 결과 집계가 쉬움
- 시험/문항 수정 이후에도 예전 결과가 깨지지 않음
- 반 이름 구조를 마스터 + 조합으로 나눠 관리할 수 있어 운영이 안정적임
- 손풀이 이미지까지 결과 스냅샷에 연결되어 리뷰 재현성이 높음

## 함께 보면 좋은 파일
- [docs/project-overview.md](./project-overview.md)
- [supabase/setup20260310.sql](../supabase/setup20260310.sql)
- [src/types/database.ts](../src/types/database.ts)
