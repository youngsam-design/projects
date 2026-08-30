# Spacing

이 프로젝트는 CSS-in-JS 없이 **CSS Modules + CSS 커스텀 프로퍼티**로만 스타일을 작성합니다.

`spacing['{name}']` — `padding`, `margin`, `gap` 등에 쓰는 값의 JS 레퍼런스(값 확인용). 실제 값은 `spacing/spacing.scss`에 `--{name}` 커스텀 프로퍼티로 노출되어 있고, 컴포넌트는 이 CSS 변수를 참조합니다.

---

## 토큰 구조

### 고정 px 값

| 토큰                           | CSS 변수              | 값     | 용도 예시              |
| ------------------------------ | --------------------- | ------ | ---------------------- |
| `spacing['spacing-tiny-sm']`   | `--spacing-tiny-sm`   | `2px`  | 아이콘 간격, 미세 여백 |
| `spacing['spacing-tiny-md']`   | `--spacing-tiny-md`   | `4px`  | 배지, 태그 내부 여백   |
| `spacing['spacing-tiny-lg']`   | `--spacing-tiny-lg`   | `8px`  | 버튼 내부 수직 여백    |
| `spacing['spacing-normal-sm']` | `--spacing-normal-sm` | `12px` | 소형 컴포넌트 여백     |
| `spacing['spacing-normal-md']` | `--spacing-normal-md` | `16px` | 기본 여백 (카드, 인풋) |
| `spacing['spacing-normal-lg']` | `--spacing-normal-lg` | `24px` | 섹션 내부 여백         |
| `spacing['spacing-normal-xl']` | `--spacing-normal-xl` | `32px` | 섹션 간 여백           |

### 음수 여백

| 토큰                                    | CSS 변수                       | 값      | 용도 예시                      |
| --------------------------------------- | ------------------------------ | ------- | ------------------------------ |
| `spacing['spacing-negative-normal-md']` | `--spacing-negative-normal-md` | `-16px` | 오버랩 레이아웃, 네거티브 마진 |

### CSS 변수 기반 (반응형)

`spacing-spacious-*`, `spacing-huge-*` 토큰은 뷰포트에 따라 자동으로 크기가 변합니다(≤767px 기본값, ≥768px 확대값 — `spacing/spacing.scss` 참고).

| 토큰                             | CSS 변수                | 설명                  |
| -------------------------------- | ----------------------- | --------------------- |
| `spacing['spacing-spacious-sm']` | `--spacing-spacious-sm` | 반응형 여백 (소)      |
| `spacing['spacing-spacious-md']` | `--spacing-spacious-md` | 반응형 여백 (중)      |
| `spacing['spacing-spacious-lg']` | `--spacing-spacious-lg` | 반응형 여백 (대)      |
| `spacing['spacing-huge-sm']`     | `--spacing-huge-sm`     | 대형 반응형 여백 (소) |
| `spacing['spacing-huge-md']`     | `--spacing-huge-md`     | 대형 반응형 여백 (중) |
| `spacing['spacing-huge-lg']`     | `--spacing-huge-lg`     | 대형 반응형 여백 (대) |

---

## 1. CSS Modules 방식 (기본)

```scss
/* Component.module.scss */
.card {
  padding: var(--spacing-normal-md);
}

.row {
  display: flex;
  gap: var(--spacing-normal-sm);
}

.hero {
  /* spacious-*, huge-* 는 반응형 CSS 변수라 그대로 사용 가능 */
  padding: var(--spacing-huge-lg);
}

.overlap {
  margin-top: var(--spacing-negative-normal-medium);
}
```

```tsx
import styles from './Component.module.scss';

<div className={styles.card}>카드</div>
<div className={styles.row}>
  <span>아이템 1</span>
  <span>아이템 2</span>
</div>
```

---

## 2. inline style 방식 (런타임 동적 값 전용)

값이 사용자 조작이나 계산 결과로 런타임에 정해질 때만 씁니다.

```tsx
// 사용자가 조절한 값을 그대로 반영하는 경우
<div style={{ height: `${resizedHeight}px` }}>리사이즈 가능한 패널</div>
```

정적인 spacing 값을 인라인으로 쓸 이유는 없습니다 — CSS Modules에서 `var(--spacing-...)`로 참조하는 쪽을 기본으로 합니다.
