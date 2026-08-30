# Effect

이 프로젝트는 CSS-in-JS 없이 **CSS Modules + CSS 커스텀 프로퍼티**로만 스타일을 작성합니다.

`effect.blur.{size}` — `backdrop-filter` 값(문자열)의 JS 레퍼런스(값 확인용). 실제 값은 `effect/effect.css`에 `--blur-{size}` 커스텀 프로퍼티로도 노출되어 있고, 컴포넌트는 이 CSS 변수를 참조합니다.

---

## 토큰 구조

| 토큰                 | CSS 변수    | 값                          | 용도 예시                                                                     |
| -------------------- | ----------- | --------------------------- | ----------------------------------------------------------------------------- |
| `effect.blur.small`  | `--blur-sm` | `blur(8px)`                 | 작은 배지·툴팁 위의 가벼운 블러                                               |
| `effect.blur.medium` | `--blur-md` | `blur(12px)`                | 에디터 툴바 등 중간 톤 블러                                                   |
| `effect.blur.large`  | `--blur-lg` | `saturate(180%) blur(20px)` | 팝오버 메뉴, 스크롤에 고정되는 헤더처럼 아래 콘텐츠 색이 배어나오는 유리 패널 |

블러 효과는 대부분 반투명 배경과 짝을 이룹니다 — 배경 토큰은 `foundation/color`의 `--color-neutral-background-blurred-main` 등을 참고하세요.

---

## 1. CSS Modules 방식 (기본)

```scss
/* Component.module.scss */
.popover {
  background: var(--color-neutral-background-blurred-main);
  backdrop-filter: var(--blur-lg);
}

.stickyHeader {
  background-color: rgba(var(--theme-background), 0.88);
  backdrop-filter: var(--blur-lg);
  -webkit-backdrop-filter: var(--blur-lg);
}
```

```tsx
import styles from './Component.module.scss';

<div className={styles.popover}>메뉴</div>
<header className={styles.stickyHeader}>헤더</header>
```

---

## 2. inline style 방식 (런타임 동적 값 전용)

값이 사용자 조작이나 계산 결과로 런타임에 정해질 때만 씁니다.

```tsx
import { effect } from '../../foundation';

<div style={{ backdropFilter: isFocused ? effect.blur.large : effect.blur.small }}>
  포커스 상태에 따라 블러 강도가 달라지는 패널
</div>;
```

정적인 blur 값을 인라인으로 쓸 이유는 없습니다 — CSS Modules에서 `var(--blur-...)`로 참조하는 쪽을 기본으로 합니다.
