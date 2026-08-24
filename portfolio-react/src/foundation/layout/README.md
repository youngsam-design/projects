# Layout

이 프로젝트는 CSS-in-JS 없이 **CSS Modules + CSS 커스텀 프로퍼티**로만 스타일을 작성합니다. `breakpoints`는 미디어쿼리 조건을 정의하는 토큰이라 CSS 커스텀 프로퍼티로 표현할 수 없고(미디어쿼리 조건 안에서는 `var()`를 쓸 수 없음), CSS Modules에서는 실제 px 값을 직접 기입합니다. `container`/`containerPadding`/`negativeContainerPadding`은 일반 스타일 값이라 `var(--container-*)` 형태로도 노출되어 있습니다([Container 토큰](#container-토큰) 참고).

---

## 토큰 구조

| 토큰 | 조건 | 뷰포트 범위 |
|------|------|------------|
| `breakpoints.compact` | `{ max: '320px' }` | ≤ 320px |
| `breakpoints.medium` | `{ min: '321px', max: '480px' }` | 321px ~ 480px |
| `breakpoints.expanded` | `{ min: '481px', max: '767px' }` | 481px ~ 767px |
| `breakpoints.large` | `{ min: '768px', max: '1023px' }` | 768px ~ 1023px |
| `breakpoints['extra-large']` | `{ min: '1024px' }` | ≥ 1024px |

`foundation/layout/_breakpoints.scss`는 이 값들을 Sass 변수로 미러링한 파일입니다. TS와 Sass 사이에 빌드 타임 브릿지가 없어서 값을 자동으로 공유할 수 없기 때문에 존재하며, `spacing.scss`/`typography.scss`처럼 foundation 내부에서 미디어쿼리 조건을 직접 참조해야 하는 곳에서만 씁니다. 값을 바꿀 땐 두 파일을 함께 수정하세요.

```ts
import { breakpoints } from '../../foundation';

// compact:      초소형 모바일 (max-width: 320px)
// medium:       모바일 (min-width: 321px, max-width: 480px)
// expanded:     태블릿 (min-width: 481px, max-width: 767px)
// large:        작은 데스크탑 (min-width: 768px, max-width: 1023px)
// extra-large:  데스크탑 (min-width: 1024px)
```

`extra-large`는 하이픈이 있는 키라 대괄호로 접근합니다: `breakpoints['extra-large']`.

---

## 1. CSS Modules 방식 (기본)

CSS Modules에서는 JS 토큰을 미디어쿼리 조건 안에 직접 참조할 수 없으므로 토큰의 실제 값을 기입합니다.

```scss
/* Component.module.scss */
.container {
  max-width: 1200px;
  padding: 0 24px;
}

/* expanded 이하: max-width 767px */
@media (max-width: 767px) {
  .container {
    padding: 0 16px;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

/* large: 768px ~ 1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

/* expanded 이하: max-width 767px */
@media (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
```

```tsx
import styles from './Component.module.scss';

<div className={styles.container}>
  <div className={styles.grid}>...</div>
</div>
```

> 분기점 수치는 `breakpoints` 토큰 기준을 따릅니다.
> compact: ≤ 320px / medium: 321px ~ 480px / expanded: 481px ~ 767px / large: 768px ~ 1023px / extra-large: ≥ 1024px

---

## 2. JS 조건 분기 방식

미디어쿼리가 아닌 JavaScript 로직으로 렌더링 자체를 분기해야 할 때 사용합니다(레이아웃 컴포넌트 자체를 교체하는 경우). 단순한 스타일 차이라면 위 CSS Modules 방식을 권장합니다.

### window.innerWidth 직접 비교 (SSR 미지원)

```tsx
const isCompact = window.innerWidth <= 767;
const isExtraLarge = window.innerWidth >= 1024;

{isCompact && <MobileNav />}
{isExtraLarge && <DesktopSidebar />}
```

### useMediaQuery hook

```tsx
import { useMediaQuery } from 'react-responsive'; // 또는 프로젝트 내 hook
import { breakpoints } from '../../foundation';

function Component() {
  const isCompact    = useMediaQuery({ maxWidth: breakpoints.expanded.max });
  const isLarge      = useMediaQuery({
    minWidth: breakpoints.large.min,
    maxWidth: breakpoints.large.max,
  });
  const isExtraLarge = useMediaQuery({ minWidth: breakpoints["extra-large"].min });

  return (
    <>
      {isCompact    && <MobileLayout />}
      {isLarge      && <TabletLayout />}
      {isExtraLarge && <DesktopLayout />}
    </>
  );
}
```

---

## Container 토큰

`breakpoints`와 달리 `container` / `containerPadding` / `negativeContainerPadding`은 미디어쿼리 조건이 아니라 **일반 스타일 값**(px 문자열)입니다. `layout/layout.css`에 `--container-*` / `--container-padding-*` / `--negative-container-padding-*` 커스텀 프로퍼티로도 노출되어 있습니다.

| 토큰 | CSS 변수 | 값 |
|------|---------|-----|
| `container.xl` | `--container-xl` | `'1040px'` |
| `container.lg` | `--container-lg` | `'836px'` |
| `container.md` | `--container-md` | `'496px'` |
| `container.sm` | `--container-sm` | `'428px'` |
| `container.xs` | `--container-xs` | `'360px'` |
| `containerPadding.lg` | `--container-padding-lg` | `'32px'` |
| `containerPadding.md` | `--container-padding-md` | `'20px'` |
| `containerPadding.sm` | `--container-padding-sm` | `'8px'` |
| `negativeContainerPadding.lg` | `--negative-container-padding-lg` | `'-32px'` |
| `negativeContainerPadding.md` | `--negative-container-padding-md` | `'-20px'` |
| `negativeContainerPadding.sm` | `--negative-container-padding-sm` | `'-8px'` |

### CSS Modules 방식 (기본)

```scss
.container {
  max-width: var(--container-lg);
  padding: 0 var(--container-padding-md);
}

/* 컨테이너 좌우 패딩 밖으로 이미지를 꽉 채우는 bleed 레이아웃 */
.bleedImage {
  margin-inline: var(--negative-container-padding-md);
}
```

### inline style 방식 (런타임 동적 값 전용)

정적인 컨테이너 값을 인라인으로 쓸 이유는 없지만, 값이 런타임에 계산될 때는 JS 레퍼런스로 조합할 수 있습니다.

```tsx
import { container, containerPadding } from '../../foundation';

<div style={{ maxWidth: container.lg, padding: `0 ${containerPadding.md}` }}>
  컨테이너
</div>
```
