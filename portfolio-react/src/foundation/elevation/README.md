# Elevation

이 프로젝트는 CSS-in-JS 없이 **CSS Modules + CSS 커스텀 프로퍼티**로만 스타일을 작성합니다.

`elevation.{level}` — `box-shadow` 값(문자열)의 JS 레퍼런스(값 확인용). 실제 값은 `elevation/elevation.css`에 `--elevation-{level}` 커스텀 프로퍼티로도 노출되어 있고, 컴포넌트는 이 CSS 변수를 참조합니다.

---

## 토큰 구조

| 토큰 | CSS 변수 | 값 | 용도 |
|------|---------|----|------|
| `elevation.small` | `--elevation-small` | `0px 2px 4px 0px rgba(0, 0, 0, 0.06)` | 카드, 드롭다운 등 낮은 층위 |
| `elevation.medium` | `--elevation-medium` | `0px 2px 8px 0px rgba(0, 0, 0, 0.08)` | 모달, 패널 등 중간 층위 |

---

## 1. CSS Modules 방식 (기본)

```scss
/* Component.module.scss */
.card {
  box-shadow: var(--elevation-small);
  border-radius: var(--radius-small);
}

.interactive {
  box-shadow: var(--elevation-small);
  transition: box-shadow var(--duration-short-03) var(--easing-standard);

  &:hover {
    box-shadow: var(--elevation-medium);
  }
}
```

```tsx
import styles from './Component.module.scss';

<div className={styles.card}>카드</div>
<button className={styles.interactive}>호버하면 그림자가 강해지는 버튼</button>
```

---

## 2. inline style 방식 (런타임 동적 값 전용)

값이 사용자 조작이나 계산 결과로 런타임에 정해질 때만 씁니다.

```tsx
import { elevation } from '../../foundation';

const isElevated = someRuntimeCondition;

<div style={{ boxShadow: isElevated ? elevation.medium : elevation.small }}>
  상태에 따라 달라지는 그림자
</div>
```

정적인 elevation 값을 인라인으로 쓸 이유는 없습니다 — CSS Modules에서 `var(--elevation-...)`로 참조하는 쪽을 기본으로 합니다.
