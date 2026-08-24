# Typography

이 프로젝트는 CSS-in-JS 없이 **CSS Modules + CSS 커스텀 프로퍼티**로만 스타일을 작성합니다.

`typography.{group}.{size}` — `fontSize` + `lineHeight`의 JS 레퍼런스(값 확인용)
`typography.{group}.{size}.{weight}` — `fontSize` + `lineHeight` + `fontWeight`의 JS 레퍼런스

실제 값은 `typography/typography.scss`에 CSS 커스텀 프로퍼티(`--display-*`, `--heading-*`는 반응형, `--body-*`/`--caption-*`/`--label-medium`은 고정값)와, 그대로 적용 가능한 유틸리티 클래스(`.display-large-bold` 등)로도 노출되어 있습니다.

---

## 1. className 방식 (기본)

`typography.scss`에 정의된 유틸리티 클래스를 그대로 적용합니다. 클래스명은 `{group}-{size}-{weight}` 형태입니다.

```tsx
<p className="body-large-bold">텍스트</p>
<p className="body-large-regular">텍스트</p>
<h1 className="display-large-bold">제목</h1>
<h2 className="heading-medium-semibold">소제목</h2>
<span className="caption-small-regular">캡션</span>
<label className="label-medium-semibold">레이블</label>
```

---

## 2. CSS Modules 방식 (개별 속성 조합)

유틸리티 클래스가 원하는 조합을 제공하지 않거나, 다른 속성과 함께 정의하고 싶을 때는 CSS 변수를 직접 조합합니다.

```scss
/* Component.module.scss */
.title {
  font-size: var(--display-large); /* 반응형: ≤767px 기본값, ≥768px 확대값 */
  line-height: 1.35;
  font-weight: var(--font-weight-bold);
}

.body {
  font-size: var(--body-medium); /* 고정값, 반응형 아님 */
  line-height: 1.45;
  font-weight: var(--font-weight-regular);
  color: var(--color-neutral-foreground-main);
}

.caption {
  font-size: var(--caption-small);
  line-height: 1.47;
  font-weight: var(--font-weight-semibold);
}
```

```tsx
import styles from './Component.module.scss';

<h1 className={styles.title}>제목</h1>
<p className={styles.body}>텍스트</p>
<span className={styles.caption}>캡션</span>
```

---

## 3. inline style 방식 (런타임 동적 값 전용)

값이 런타임에 계산되거나 사용자 입력에 따라 달라질 때만 씁니다. 정적인 타이포그래피 스타일을 인라인으로 쓸 이유는 없습니다 — className이나 CSS Modules 쪽이 캐스케이드·pseudo-class를 그대로 활용할 수 있어 더 낫습니다.

```tsx
import { typography } from '../../foundation';

// 서버에서 받은 값에 따라 굵기를 결정하는 경우 등
<p style={typography.body.large[weightFromServer]}>텍스트</p>
```

---

## 토큰 구조

| group   | size                            | weight 키                          | lineHeight |
|---------|---------------------------------|------------------------------------|------------|
| display | large · medium · small          | bold · semibold                    | 1.35       |
| heading | large · medium · small          | bold · semibold · medium           | 1.42       |
| body    | large · medium · small          | bold · semibold · medium · regular | 1.45       |
| caption | medium · small · xsmall         | semibold · regular                 | 1.47       |
| label   | large · medium (semibold) · small · xsmall (medium) | — | 고정 px |

---

## 반응형

Display · Heading의 `fontSize`는 CSS 변수(`var(--display-large)` 등)로, 뷰포트 너비에 따라 자동으로 변경됩니다. Body · Caption · Label은 고정값이라 반응형이 아닙니다.

| 구간 | 조건 |
|------|------|
| 기본값 | ≤ 767px (`breakpoints.expanded` 이하) |
| 확대값 | ≥ 768px (`breakpoints.large` 이상) |

모든 방식(className · CSS Modules · inline style)에서 동일하게 반응형이 동작합니다.
