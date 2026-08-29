# Color

이 프로젝트는 CSS-in-JS 없이 **CSS Modules + CSS 커스텀 프로퍼티**로만 스타일을 작성합니다. 동적 인라인 style은 런타임에 값이 바뀌는 경우(사용자가 편집하는 프로젝트 테마 색상 등)에만 씁니다.

`semanticColor.{role}.{type}.{variant}` — 역할 기반 토큰의 JS 레퍼런스(값 확인용)
`primitiveColor.{hue}[{step}]` — 팔레트 원본값(디자인 레퍼런스용, 컴포넌트에서 직접 사용 비권장)

이 JS 객체들의 실제 값은 `color/color.css`에 `--color-{role}-{type}-{variant}` / `--palette-{hue}-{step}` 커스텀 프로퍼티로도 노출되어 있고, 컴포넌트는 이 CSS 변수를 참조합니다.

---

## 토큰 구조

### semanticColor

| role | type | 대표 variant | CSS 속성 |
|------|------|-------------|---------|
| neutral | foreground | main · low · high · lowest · disabled · inverse-main | `color` |
| neutral | background | main · low · high · lowest · disabled | `backgroundColor` |
| neutral | border | main · low · high · lowest · disabled | `borderColor` |
| primary | foreground | main · low · high · disabled · inverse-main | `color` |
| primary | background | main · low · high · disabled | `backgroundColor` |
| primary | border | main · low · high · disabled | `borderColor` |
| secondary / error / success / warning / info / promo | foreground / background / border | main 등 | — |

### primitiveColor (레퍼런스용)

```ts
primitiveColor.violet[600]  // '#5E50FA'
primitiveColor.gray[900]    // '#22272B'
primitiveColor.red[600]     // '#F91F1F'
```

---

## 1. CSS Modules 방식 (기본)

CSS 변수 이름은 `--color-{role}-{type}-{variant}` 패턴을 따릅니다(하이픈이 있는 variant는 그대로 하이픈으로 이어집니다, 예: `inverse-main` → `--color-neutral-foreground-inverse-main`).

```scss
/* Component.module.scss */
.text {
  color: var(--color-neutral-foreground-main);
}

.card {
  background: var(--color-neutral-background-low);
  border: 1px solid var(--color-neutral-border-main);
}

.primaryButton {
  color: var(--color-neutral-foreground-inverse-main);
  background: var(--color-primary-background-main);

  &:hover {
    background: var(--color-primary-background-hovered-pressed);
  }

  &:disabled {
    color: var(--color-neutral-foreground-disabled);
    background: var(--color-neutral-background-disabled-main);
  }
}

.errorText {
  color: var(--color-error-foreground-main);
}
```

```tsx
import styles from './Component.module.scss';

<p className={styles.text}>기본 텍스트</p>
<div className={styles.card}>카드</div>
<button className={styles.primaryButton}>버튼</button>
<p className={styles.errorText}>에러 메시지</p>
```

---

## 2. inline style 방식 (런타임 동적 값 전용)

값이 컴파일 타임에 정해지지 않고 런타임에 계산되거나 사용자가 편집하는 경우에만 씁니다. 예를 들어 이 프로젝트의 프로젝트별 테마 색상(사용자가 컬러 피커로 지정)은 문서 데이터에서 읽어와 인라인 커스텀 프로퍼티로 주입합니다.

```tsx
// 사용자가 편집한 테마 색상을 문서 데이터에서 읽어와 그대로 주입하는 경우
<div
  style={{
    "--theme-accent": document.theme.accentColor,
    "--theme-background": document.theme.mainBackgroundColor,
  }}
>
  프로젝트 콘텐츠
</div>
```

정적인 semanticColor 값을 인라인으로 쓸 이유는 없습니다 — CSS Modules에서 `var(--color-...)`로 참조하는 쪽이 캐스케이드·명시도·pseudo-class를 그대로 활용할 수 있어 더 낫습니다.
