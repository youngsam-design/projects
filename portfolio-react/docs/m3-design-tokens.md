# Material Design 3 (Expressive) 디자인 토큰 스펙

Google이 공개한 M3 Expressive 리서치([design.google](https://design.google/library/expressive-material-design-google-research))와
공식 스펙 사이트([m3.material.io](https://m3.material.io))에서 뽑아낸 타이포그래피·도형·모션 토큰 정리.
m3.material.io의 토큰 값은 트리형 뷰어를 펼쳐야 보이는 구조라 헤드리스 브라우저로 직접 펼쳐서 확인했다.

참고로 만든 시점의 스냅샷이므로, 정확한 값이 다시 필요하면 아래 원본 링크에서 재확인한다.

- 타이포그래피: <https://m3.material.io/styles/typography/type-scale-tokens>
- 도형: <https://m3.material.io/styles/shape/corner-radius-scale>
- 모션: <https://m3.material.io/styles/motion/easing-and-duration/tokens-specs>

## 1. 리서치 요약

- 46개 연구 프로젝트, 18,000명 이상 참여 (아이트래킹·사용성 테스트·포커스그룹)
- expressive 디자인 선호도: 18-24세 87%, 전 연령대에서 우세
- 브랜드 인식: 하위문화감 +32%, 현대성 +34%, 혁신성 +30%
- 사용성: 주요 UI 요소를 찾는 속도 최대 4배 향상, 45세 이상 사용자 성능이 젊은 층 수준까지 개선
- 단, 접근성 기준(대비, 터치 영역)은 그대로 충족해야 하고 은행 앱처럼 신중해야 하는 맥락에서는 절제된 적용을 권장

## 2. 타이포그래피 — Type Scale

Major Second 스케일(1.125배, 기준 14px). 브랜드 폰트는 **Google Sans**(Display/Headline/Title Large),
나머지는 **Google Sans Text**(plain) — Expressive 업데이트에서 Roboto 기본값을 교체한 것.

| 스타일 | Size | Line height | Weight | Tracking |
|---|---|---|---|---|
| Display Large | 57pt | 64pt | 400 | 0 |
| Display Medium | 45pt | 52pt | 400 | 0 |
| Display Small | 36pt | 44pt | 400 | 0 |
| Headline Large | 32pt | 40pt | 400 | 0 |
| Headline Medium | 28pt | 36pt | 400 | 0 |
| Headline Small | 24pt | 32pt | 400 | 0 |
| Title Large | 22pt | 28pt | 400 | 0 |
| Title Medium | 16pt | 24pt | 500 | 0 |
| Title Small | 14pt | 20pt | 500 | 0 |
| Body Large | 16pt | 24pt | 400 | 0 |
| Body Medium | 14pt | 20pt | 400 | 0 |
| Body Small | 12pt | 16pt | 400 | 0.1pt |
| Label Large | 14pt | 20pt | 500 (prominent 700) | 0 |
| Label Medium | 12pt | 16pt | 500 (prominent 700) | 0.1pt |
| Label Small | 11pt | 16pt | 500 | 0.1pt |

각 스타일에는 두께를 높이고 약간 조정한 **emphasized 버전**이 하나씩 더 있다(총 30개 = 15 baseline + 15 emphasized).
emphasized는 뱃지·버튼·선택된 리스트 항목처럼 상태/중요도를 강조할 곳에만 baseline과 섞어 쓴다.

### 웹 단위 변환

| Android | Web |
|---|---|
| font size: `sp` | `rem` (변환 비율 `size / 16`) |
| letter spacing: `tracking(px) / font size(sp)` | 동일 공식으로 `rem` 단위 |

예: `57sp → 3.5625rem`, `.2 tracking / 16sp font size → 0.0125rem`.

## 3. 도형 — Corner Radius Scale (10단계)

| 이름 | 값 |
|---|---|
| None | 0 |
| Extra small | 4dp |
| Small | 8dp |
| Medium | 12dp |
| Large | 16dp |
| Large increased | 20dp |
| Extra large | 28dp |
| Extra large increased | 32dp |
| Extra extra large | 48dp |
| Full | 완전히 둥글게 (pill) |

- 중첩된 둥근 요소끼리는 같은 반경을 쓰지 않는다. **optical roundness** 공식: `바깥 반경 − 패딩 = 안쪽 반경` (예: `48dp − 14dp = 34dp`).
- 정보 밀도가 높은 컴포넌트(카드 등)에는 큰/완전 둥근 코너를 피한다 — 콘텐츠가 잘려 보인다.
- 둥근 모서리(rounded) ↔ 각진 모서리(cut)를 전환해 변주를 줄 수 있다.

## 4. 모션 — Easing & Duration

Expressive 업데이트에서 네이티브(Android/iOS/Flutter)는 duration/easing 커브 대신
**스프링 물리 기반 모션**(damping/stiffness)으로 전환했지만, CSS는 스프링을 지원하지 않으므로
웹에서는 아래 easing/duration 토큰을 계속 사용한다(공식 문서상 "no longer maintained"이지만 웹 전환에는 여전히 유효).

### Easing (CSS `cubic-bezier`)

| 토큰 | CSS 값 | 용도 |
|---|---|---|
| `md.sys.motion.easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` | 단순/작은/유틸리티성 전환 |
| `md.sys.motion.easing.standard.decelerate` | `cubic-bezier(0, 0, 0, 1)` | 진입(끝에서 감속) |
| `md.sys.motion.easing.standard.accelerate` | `cubic-bezier(0.3, 0, 1, 1)` | 퇴장(시작부터 가속) |
| `md.sys.motion.easing.emphasized.decelerate` | `cubic-bezier(0.05, 0.7, 0.1, 1.0)` | 화면 많은 영역을 가로지르는 진입, expressive 스타일의 기본 |
| `md.sys.motion.easing.emphasized.accelerate` | `cubic-bezier(0.3, 0.0, 0.8, 0.15)` | 위 항목의 퇴장 |

> plain `emphasized`(양방향)는 Android `PathInterpolator` 기반이라 CSS `cubic-bezier`로 정확히 옮길 수 없다 — 웹에서는 Standard로 대체 권장(공식 문서 명시).

### Duration

| 구간 | 토큰 | 값 |
|---|---|---|
| Short | `duration.short1` ~ `short4` | 50ms / 100ms / 150ms / 200ms |
| Medium | `duration.medium1` ~ `medium4` | 250ms / 300ms / 350ms / 400ms |
| Long | `duration.long1` ~ `long4` | 450ms / 500ms / 550ms / 600ms |
| Extra long | `duration.extra-long1` ~ `extra-long4` | 700ms / 800ms / 900ms / 1000ms |

사용 예시(공식 문서 기준):

- 선택 컨트롤(체크박스 등): `short4`(200ms) + Standard easing
- FAB → Sheet 확장: `medium4`(400ms) + Emphasized easing
- 카드 → 전체화면 확장: `long2`(500ms) + Emphasized easing
- 캐러셀 자동 전환처럼 사용자 입력 없는 ambient 전환: `extra-long1`(700ms) + Emphasized easing

### Spring (네이티브 전용, 참고용)

| 이름 | Spatial damping / stiffness | Effects damping / stiffness |
|---|---|---|
| Fast | 0.9 / 1400 | 1 / 3800 |
| Default | 0.9 / 700 | 1 / 1600 |
| Slow | 0.9 / 300 | 1 / 800 |

CSS에는 직접 대응하는 문법이 없어 웹에서 스프링 모션이 필요하면 별도 라이브러리(예: Framer Motion, react-spring)가 필요하다.
