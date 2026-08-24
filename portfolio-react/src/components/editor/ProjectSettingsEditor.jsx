import styles from "./ProjectEditor.module.scss";

function createMetaId() {
  return `meta_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function rgbStringToHex(value) {
  const parts = (value ?? "")
    .split(",")
    .map((part) => Number(part.trim()));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return "#000000";
  }
  return `#${parts
    .map((part) => Math.min(255, Math.max(0, Math.round(part))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToRgbString(hex) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return "0, 0, 0";
  return match
    .slice(1)
    .map((part) => parseInt(part, 16))
    .join(", ");
}

export default function ProjectSettingsEditor({ document, onChange }) {
  const updateMeta = (id, field, value) =>
    onChange(
      (current) => ({
        ...current,
        meta: current.meta.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      }),
      `meta:${id}:${field}`,
    );

  return (
    <div className={styles.settings}>
      <h2 className={styles.settingsHeading}>프로젝트 설정</h2>
      <div className={styles.settingsContent}>
        <section className={styles.settingsSection}>
          <h2>기본 정보</h2>
          <label className={styles.field}>
            프로젝트 제목
            <input
              onChange={(event) =>
                onChange(
                  (current) => ({ ...current, title: event.target.value }),
                  "project:title",
                )
              }
              value={document.title}
            />
          </label>
          <label className={styles.field}>
            검색 및 목록 요약
            <textarea
              onChange={(event) =>
                onChange(
                  (current) => ({ ...current, excerpt: event.target.value }),
                  "project:excerpt",
                )
              }
              rows="3"
              value={document.excerpt}
            />
          </label>
          <label className={styles.field}>
            브라우저 및 SEO 제목
            <input
              onChange={(event) =>
                onChange(
                  (current) => ({
                    ...current,
                    pageMeta: {
                      ...current.pageMeta,
                      title: event.target.value,
                    },
                  }),
                  "pageMeta:title",
                )
              }
              value={document.pageMeta.title}
            />
          </label>
        </section>

        <section className={styles.settingsSection}>
          <h2>히어로</h2>
          <label className={styles.field}>
            상단 보조 문구
            <input
              onChange={(event) =>
                onChange(
                  (current) => ({
                    ...current,
                    hero: { ...current.hero, eyebrow: event.target.value },
                  }),
                  "hero:eyebrow",
                )
              }
              value={document.hero.eyebrow}
            />
          </label>
          <label className={styles.field}>
            히어로 제목
            <input
              onChange={(event) =>
                onChange(
                  (current) => ({
                    ...current,
                    hero: { ...current.hero, headline: event.target.value },
                  }),
                  "hero:headline",
                )
              }
              value={document.hero.headline}
            />
          </label>
          <label className={styles.field}>
            커버 이미지
            <select
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  hero: {
                    ...current.hero,
                    coverAssetId: event.target.value,
                  },
                }))
              }
              value={document.hero.coverAssetId}
            >
              {document.assets
                .filter((asset) => asset.kind === "image")
                .map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name ?? asset.id}
                  </option>
                ))}
            </select>
          </label>
          <label className={styles.checkboxField}>
            <input
              checked={document.hero.mesh ?? false}
              onChange={(event) =>
                onChange(
                  (current) => ({
                    ...current,
                    hero: { ...current.hero, mesh: event.target.checked },
                  }),
                  "hero:mesh",
                )
              }
              type="checkbox"
            />
            커버 이미지에 메시 그라디언트 배경 적용
          </label>
          {document.hero.mesh && (
            <label className={styles.checkboxField}>
              <input
                checked={document.hero.meshWarp ?? false}
                onChange={(event) =>
                  onChange(
                    (current) => ({
                      ...current,
                      hero: { ...current.hero, meshWarp: event.target.checked },
                    }),
                    "hero:meshWarp",
                  )
                }
                type="checkbox"
              />
              노이즈 왜곡 (성능에 영향을 줄 수 있어요)
            </label>
          )}
        </section>

        <section className={styles.settingsSection}>
          <h2>본문 너비</h2>
          <p className={styles.settingsHelp}>
            제목(h1)을 제외한 모든 본문 블록이 이 너비를 공유합니다. 이미지·영상은 블록별로 계속 개별 조절할 수 있습니다.
          </p>
          <label className={styles.field}>
            너비
            <select
              onChange={(event) =>
                onChange(
                  (current) => ({
                    ...current,
                    contentWidth: event.target.value,
                  }),
                  "project:contentWidth",
                )
              }
              value={document.contentWidth ?? "large"}
            >
              <option value="large">Large</option>
              <option value="medium">Medium</option>
              <option value="small">Small</option>
            </select>
          </label>
        </section>

        <section className={styles.settingsSection}>
          <div className={styles.settingsSectionHeader}>
            <h2>프로젝트 메타데이터</h2>
            <button
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  meta: [
                    ...current.meta,
                    { id: createMetaId(), label: "Label", value: "Value" },
                  ],
                }))
              }
              type="button"
            >
              + 항목
            </button>
          </div>
          <div className={styles.metaList}>
            {document.meta.map((item) => (
              <div className={styles.metaRow} key={item.id}>
                <input
                  aria-label="메타데이터 이름"
                  onChange={(event) =>
                    updateMeta(item.id, "label", event.target.value)
                  }
                  value={item.label}
                />
                <input
                  aria-label="메타데이터 값"
                  onChange={(event) =>
                    updateMeta(item.id, "value", event.target.value)
                  }
                  value={item.value}
                />
                <button
                  aria-label={`${item.label} 항목 삭제`}
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      meta: current.meta.filter(
                        (candidate) => candidate.id !== item.id,
                      ),
                    }))
                  }
                  type="button"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.settingsSection}>
          <h2>색상 테마</h2>
          <p className={styles.settingsHelp}>
            RGB 값을 쉼표로 구분해 입력합니다.
          </p>
          <div className={styles.themeGrid}>
            {Object.entries(document.theme)
              .filter(([key]) => key !== "meshColors")
              .map(([key, value]) => (
              <label className={styles.field} key={key}>
                {key}
                <div className={styles.colorInputRow}>
                  <input
                    aria-label={`${key} 색상 선택`}
                    className={styles.colorSwatch}
                    onChange={(event) =>
                      onChange(
                        (current) => ({
                          ...current,
                          theme: {
                            ...current.theme,
                            [key]: hexToRgbString(event.target.value),
                          },
                        }),
                        `theme:${key}`,
                      )
                    }
                    type="color"
                    value={rgbStringToHex(value)}
                  />
                  <input
                    onChange={(event) =>
                      onChange(
                        (current) => ({
                          ...current,
                          theme: {
                            ...current.theme,
                            [key]: event.target.value,
                          },
                        }),
                        `theme:${key}`,
                      )
                    }
                    placeholder="255, 255, 255"
                    value={value}
                  />
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className={styles.settingsSection}>
          <div className={styles.settingsSectionHeader}>
            <h2>메시 그라디언트 색상</h2>
            <button
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  theme: {
                    ...current.theme,
                    meshColors: [...(current.theme.meshColors ?? []), "255, 255, 255"],
                  },
                }))
              }
              type="button"
            >
              + 색상 추가
            </button>
          </div>
          <p className={styles.settingsHelp}>
            "메시 그라디언트 배경" 옵션을 켠 이미지/영상/커버에 랜덤하게 배치되는 색상 팔레트입니다. 색상을 추가하거나 뺄 수 있습니다.
          </p>
          <div className={styles.metaList}>
            {(document.theme.meshColors ?? []).map((color, index) => (
              <div className={styles.metaRow} key={index}>
                <input
                  aria-label={`메시 색상 ${index + 1} 선택`}
                  className={styles.colorSwatch}
                  onChange={(event) =>
                    onChange(
                      (current) => ({
                        ...current,
                        theme: {
                          ...current.theme,
                          meshColors: current.theme.meshColors.map((existing, existingIndex) =>
                            existingIndex === index ? hexToRgbString(event.target.value) : existing,
                          ),
                        },
                      }),
                      `theme:meshColors:${index}`,
                    )
                  }
                  type="color"
                  value={rgbStringToHex(color)}
                />
                <input
                  aria-label={`메시 색상 ${index + 1}`}
                  onChange={(event) =>
                    onChange(
                      (current) => ({
                        ...current,
                        theme: {
                          ...current.theme,
                          meshColors: current.theme.meshColors.map((existing, existingIndex) =>
                            existingIndex === index ? event.target.value : existing,
                          ),
                        },
                      }),
                      `theme:meshColors:${index}`,
                    )
                  }
                  placeholder="255, 255, 255"
                  value={color}
                />
                <button
                  aria-label={`메시 색상 ${index + 1} 삭제`}
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      theme: {
                        ...current.theme,
                        meshColors: current.theme.meshColors.filter(
                          (_, existingIndex) => existingIndex !== index,
                        ),
                      },
                    }))
                  }
                  type="button"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
