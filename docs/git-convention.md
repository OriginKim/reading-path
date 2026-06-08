# Git 컨벤션

> 1인 개발 프로젝트 기준

---

## 브랜치 전략

```
main
└── develop
    ├── feat/이슈번호-기능명
    ├── fix/이슈번호-버그명
    ├── refactor/이슈번호-대상명
    ├── chore/이슈번호-작업명
    └── docs/이슈번호-문서명
```

| 브랜치 | 역할 | 직접 Push |
|--------|------|-----------|
| `main` | 배포 브랜치. 항상 배포 가능 상태 유지 | ❌ |
| `develop` | 개발 통합 브랜치. PR로만 머지 | ❌ |
| `feat/*` | 새 기능 개발 | ✅ |
| `fix/*` | 버그 수정 | ✅ |
| `refactor/*` | 코드 리팩터링 | ✅ |
| `chore/*` | 설정, 패키지, 배포 | ✅ |
| `docs/*` | 문서 작성 | ✅ |

**브랜치 네이밍**
```bash
{타입}/{이슈번호}-{간단한-설명}

# 예시
feat/12-google-oauth
feat/23-kakao-book-search
fix/34-jwt-token-expiry
chore/7-railway-deploy-setup
```

---

## 커밋 메시지 규칙

**형식**
```
타입: 내용 (#이슈번호)
```

**타입 목록**

| 타입 | 설명 |
|------|------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 리팩터링 (기능 변경 없음) |
| `style` | 코드 포맷팅 |
| `test` | 테스트 코드 |
| `docs` | 문서 수정 |
| `chore` | 빌드, 패키지, 설정 |
| `remove` | 파일/코드 삭제 |
| `design` | UI/스타일 변경 |

**규칙**
1. **한글로 작성** (타입은 영어 유지)
2. 제목 **50자 이내**
3. 제목 끝 **마침표 금지**
4. 이슈 번호는 `(#번호)` 형식으로 제목 끝에

**좋은 예시**
```
feat: 카카오 책 검색 API 연동 (#12)
feat: Google OAuth 로그인 구현 (#5)
fix: READ 상태 책 3권 미만일 때 버튼 비활성화 누락 수정 (#34)
chore: Supabase RLS 정책 적용 (#7)
```

**나쁜 예시**
```
fix bug                         # 내용 없음, 한글 아님
feat: 기능 추가.                 # 마침표, 내용 불명확
feat: 카카오 책 검색 API 연동    # 이슈 번호 누락
```

---

## 이슈 관리

**이슈 네이밍**
```
[타입] 간단한 설명

[feat] 카카오 책 검색 API 연동
[fix] 로그인 후 세션 유지 안 되는 버그
[chore] Railway 환경변수 세팅
```

**레이블**

| 레이블 | 설명 |
|--------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩터링 |
| `docs` | 문서 |
| `chore` | 설정/인프라 |
| `design` | UI/디자인 |
| `blocked` | 블로킹 이슈 있음 |
| `in-progress` | 작업 중 |
| `done` | 완료 |

---

## PR 규칙

**제목 형식**
```
[타입] 간단한 설명 (#이슈번호)

[feat] 카카오 책 검색 API 연동 (#12)
```

**PR 기준**
- 한 PR = 하나의 이슈
- 변경 파일 10개 이하, 변경 라인 400줄 이하 권장
- `develop` 브랜치 기준으로 PR 생성
- 1인 프로젝트 → Self-Review 후 머지

---

## 머지 전략

**feature → develop: Squash and Merge**
- 작업 브랜치 여러 커밋을 하나로 합쳐서 develop에 반영
- Squash 커밋 메시지 = PR 제목

**develop → main: Merge Commit**
- 배포 시점을 명확히 기록

**머지 후 브랜치 즉시 삭제**
- GitHub Settings → "Automatically delete head branches" 활성화

---

## Branch Protection Rules

GitHub → Settings → Branches에서 `main`, `develop` 각각 설정:
- ✅ Require a pull request before merging
- Require approvals: 0 (1인 프로젝트)
- ✅ Do not allow bypassing the above settings

---

## 버전 태그

```bash
git tag -a v1.0.0 -m "소프트 오픈"
git push origin --tags
```

| 버전 | 기준 |
|------|------|
| `v0.x.x` | 개발 중 |
| `v1.0.0` | 소프트 오픈 |
| `v1.x.0` | 기능 추가 |
| `v1.0.x` | 버그 수정 |
