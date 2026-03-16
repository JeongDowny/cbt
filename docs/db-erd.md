# CBT 데이터베이스 ERD 정리

## 개요
이 프로젝트의 DB는 크게 4개 축으로 나뉩니다.

1. 시험 메타데이터
2. 문항/이미지
3. 학생 응시 결과
4. 반/기수 관리

학생은 로그인 없이 시험을 풀고, 제출 시 `반 + 이름` 기준으로 결과가 저장됩니다.  
관리자는 시험과 반 정보를 관리하고, 반별 응시 결과를 확인합니다.

## 테이블 구성

### 1. 시험 메타데이터

#### `certifications`
- 자격증 이름 마스터
- 예: `전기기사 필기`, `전기산업기사 필기`

주요 컬럼:
- `id`
- `name`
- `created_at`
- `updated_at`

#### `exams`
- 실제 시험 회차 정보
- 하나의 자격증 아래 여러 회차가 생성됩니다

주요 컬럼:
- `id`
- `certification_id`
- `exam_year`
- `exam_round`
- `title` (generated: `2026년 1회차`)
- `status`
- `is_public`

관계:
- `certifications (1) -> exams (N)`

#### `exam_subjects`
- 시험 안의 세부 과목
- 예: `전기자기학`, `전력공학`

주요 컬럼:
- `id`
- `exam_id`
- `subject_order`
- `name`
- `time_limit_minutes`

관계:
- `exams (1) -> exam_subjects (N)`

### 2. 문항 / 이미지

#### `questions`
- 실제 문제 본문과 보기, 정답, 해설 저장

주요 컬럼:
- `id`
- `exam_subject_id`
- `question_no`
- `stem`
- `choice_1` ~ `choice_4`
- `correct_answer`
- `explanation`
- `explanation_video_url`

관계:
- `exam_subjects (1) -> questions (N)`

#### `question_images`
- 문제 이미지 경로 저장
- 이미지는 Supabase Storage 버킷에 있고, 여기에는 경로만 저장합니다

주요 컬럼:
- `id`
- `question_id`
- `image_order`
- `image_path`

관계:
- `questions (1) -> question_images (N)`

### 3. 반 / 기수 관리

#### `class_years`
- 사용 가능한 연도 목록
- 예: `2026`, `2027`

#### `class_names`
- 사용 가능한 반 이름 목록
- 예: `전기A반`, `전기B반`

#### `class_cohorts`
- 사용 가능한 기수 목록
- 예: `1`, `2`, `3`

#### `class_groups`
- 실제 학생이 선택하는 반 조합
- `연도 + 반 이름 + 기수`의 유효한 조합만 여기 등록합니다

주요 컬럼:
- `id`
- `class_year_id`
- `class_name_id`
- `class_cohort_id`

관계:
- `class_years (1) -> class_groups (N)`
- `class_names (1) -> class_groups (N)`
- `class_cohorts (1) -> class_groups (N)`

학생 화면에는 이 3개를 따로 보여주지 않고,
`2026-1 전기A반`처럼 합쳐진 하나의 선택 옵션으로 보여줍니다.

### 4. 학생 응시 결과

#### `attempts`
- 학생의 1회 응시 전체 기록

주요 컬럼:
- `id`
- `exam_id`
- `class_group_id`
- `class_year_snapshot`
- `class_name_snapshot`
- `cohort_no_snapshot`
- `user_name`
- `birth_date` (legacy 호환용)
- `started_at`
- `submitted_at`
- `status`
- `total_score`
- `passed`

중요 포인트:
- 현재 저장 기준은 `class_group_id + user_name`
- snapshot 컬럼 3개는 응시 당시 반 정보를 고정해 두기 위한 값입니다

왜 snapshot을 남기나:
- 나중에 반 이름이 수정되거나 삭제되어도
- 이미 저장된 응시 결과에는 당시 반 정보가 그대로 남아야 하기 때문입니다

관계:
- `exams (1) -> attempts (N)`
- `class_groups (1) -> attempts (N)`

#### `attempt_subjects`
- 응시 결과를 과목 단위로 나눈 기록

주요 컬럼:
- `id`
- `attempt_id`
- `exam_subject_id`
- `subject_name_snapshot`
- `score`
- `passed`

관계:
- `attempts (1) -> attempt_subjects (N)`
- `exam_subjects (1) -> attempt_subjects (N)`

#### `attempt_answers`
- 각 과목 안의 문항별 응답 스냅샷

주요 컬럼:
- `id`
- `attempt_subject_id`
- `question_id`
- `question_no`
- `stem_snapshot`
- `choice_1_snapshot` ~ `choice_4_snapshot`
- `correct_answer_snapshot`
- `explanation_snapshot`
- `explanation_video_url_snapshot`
- `image_paths_snapshot`
- `selected_answer`
- `is_correct`

관계:
- `attempt_subjects (1) -> attempt_answers (N)`
- `questions (1) -> attempt_answers (N, nullable snapshot 참조)`

왜 문항 snapshot을 남기나:
- 시험 문항이 나중에 수정되어도
- 예전 응시 결과는 당시 기준 문항/보기/정답/해설을 그대로 보여줘야 하기 때문입니다

#### `attempt_deletion_logs`
- 응시 결과 삭제 시 백업 스냅샷

주요 컬럼:
- `id`
- `attempt_id`
- `deleted_at`
- `deleted_by`
- `reason`
- `attempt_snapshot`

## 관계 요약

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

## 실제 흐름 기준 설명

### 시험 생성
1. 관리자가 자격증/연도/회차를 등록
2. 세부 과목을 추가
3. 각 과목에 문제와 보기, 정답, 해설, 이미지, 해설 영상을 저장

### 반 관리
1. 관리자가 `연도`, `반 이름`, `기수`를 각각 생성
2. 실제 사용할 조합을 `class_groups`로 등록
3. 학생은 이 조합을 합쳐진 형태로 선택

### 시험 제출
1. 학생이 시험 풀이 완료
2. 제출 시 `반 + 이름` 입력
3. `attempts` 생성
4. `attempt_subjects`, `attempt_answers` 생성
5. `finalize_attempt()`가 과목 점수/총점/합격 여부 계산

### 결과 조회
1. 학생이 `반 + 이름`으로 조회
2. `attempts`에서 일치하는 기록 검색
3. 상세 페이지에서 `attempt_subjects`, `attempt_answers` 스냅샷 기반으로 리뷰 표시

## 현재 설계의 장점
- 학생 로그인 없이도 반 기준 결과 조회 가능
- 관리자 입장에서 반별 결과 집계가 쉬움
- 시험/문항이 수정되어도 예전 결과가 깨지지 않음
- 반 이름 구조를 마스터 + 조합으로 나눠 관리할 수 있어 운영이 안정적임
