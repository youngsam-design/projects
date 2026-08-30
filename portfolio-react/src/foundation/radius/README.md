# Radius

이 프로젝트는 CSS-in-JS 없이 **CSS Modules + CSS 커스텀 프로퍼티**로만 스타일을 작성합니다.

`radius['{size}']` — `border-radius` 값의 JS 레퍼런스(값 확인용). 실제 값은 `radius/radius.css`에 `--radius-{size}` 커스텀 프로퍼티로 노출되어 있고, 컴포넌트는 이 CSS 변수를 참조합니다.

---

## 토큰 구조

| 토큰                        | CSS 변수            | 값       | 용도 예시             |
| --------------------------- | ------------------- | -------- | --------------------- |
| `radius['radius-2xsmall']`  | `--radius-2xs`      | `4px`    | 배지, 태그            |
| `radius['radius-xsmall']`   | `--radius-xs`       | `8px`    | 인풋, 버튼 (소형)     |
| `radius['radius-small']`    | `--radius-sm`       | `12px`   | 버튼, 카드 (소형)     |
| `radius['radius-medium']`   | `--radius-md`       | `16px`   | 카드, 패널            |
| `radius['radius-large']`    | `--radius-lg`       | `22px`   | 바텀시트, 모달        |
| `radius['radius-xlarge']`   | `--radius-xl`       | `28px`   | 대형 카드, 팝업       |
| `radius['radius-circular']` | `--radius-circular` | `1000px` | 칩, 아바타, 원형 버튼 |

---

## 1. CSS Modules 방식 (기본)

```scss
/* Component.module.scss */
.card {
  border-radius: var(--radius-md);
  padding: 16px;
}

.button {
  border-radius: var(--radius-sm);
}

.chip {
  border-radius: var(--radius-circular);
}

/* 특정 모서리만 적용 */
.topSheet {
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
}
```

```tsx
import styles from './Component.module.scss';

<div className={styles.card}>카드</div>
<button className={styles.button}>버튼</button>
<span className={styles.chip}>칩</span>
```

---

## 2. inline style 방식 (런타임 동적 값 전용)

값이 사용자 조작이나 서버 응답 등 런타임에 결정될 때만 씁니다. 예를 들어 이 프로젝트의 블록 에디터는 사용자가 드래그로 조절한 그리드 span 값을 인라인 스타일로 반영합니다.

```tsx
// 사용자가 조절한 값을 그대로 반영하는 경우
<div style={{ gridColumn: `span ${block.grid.span}` }}>블록</div>
```

정적인 radius 값을 인라인으로 쓸 이유는 없습니다 — CSS Modules에서 `var(--radius-...)`로 참조하는 쪽을 기본으로 합니다.
