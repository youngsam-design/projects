import Button from "../ui/Button";
import Checkbox from "../ui/Checkbox";
import IconButton from "../ui/IconButton";
import Input from "../ui/Input";
import Select from "../ui/Select";
import styles from "./ProjectEditor.module.scss";

function createMetaId() {
  return `meta_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function rgbStringToHex(value) {
  const parts = (value ?? "").split(",").map((part) => Number(part.trim()));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return "#000000";
  }
  return `#${parts
    .map((part) =>
      Math.min(255, Math.max(0, Math.round(part)))
        .toString(16)
        .padStart(2, "0"),
    )
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
        meta: current.meta.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      }),
      `meta:${id}:${field}`,
    );

  return (
    <div className={styles.settings}>
      <div className={styles.settingsContent}>
        <section className={styles.settingsSection}>
          <div className={styles.settingsSectionHeader}>
            <h2>프로젝트</h2>
          </div>

          <Input
            label="제목"
            onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }), "project:title")}
            value={document.title}
          />
          <Input
            label="내용"
            multiline
            onChange={(event) => onChange((current) => ({ ...current, excerpt: event.target.value }), "project:excerpt")}
            rows={3}
            value={document.excerpt}
          />
          <Input
            label="보조 문구"
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
          <Select
            label="커버 이미지"
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
          </Select>
          <Checkbox
            checked={document.hero.mesh ?? false}
            label="커버 이미지에 메시 그라디언트 배경 적용"
            onChange={(event) =>
              onChange(
                (current) => ({
                  ...current,
                  hero: { ...current.hero, mesh: event.target.checked },
                }),
                "hero:mesh",
              )
            }
          />
          {document.hero.mesh && (
            <Checkbox
              checked={document.hero.meshWarp ?? false}
              description="성능에 영향을 줄 수 있어요"
              label="노이즈 왜곡"
              onChange={(event) =>
                onChange(
                  (current) => ({
                    ...current,
                    hero: { ...current.hero, meshWarp: event.target.checked },
                  }),
                  "hero:meshWarp",
                )
              }
            />
          )}
        </section>

        <section className={styles.settingsSection}>
          <div className={styles.settingsSectionHeader}>
            <h2>본문 너비</h2>
          </div>

          <Select
            label=""
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
          </Select>
        </section>

        <section className={styles.settingsSection}>
          <div className={styles.settingsSectionHeader}>
            <h2>프로젝트 메타데이터</h2>
            <IconButton
              icon="add"
              label="메타데이터 항목 추가"
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  meta: [...current.meta, { id: createMetaId(), label: "Label", value: "Value" }],
                }))
              }
              size="small"
              variant="subtle"
            />
          </div>
          <div className={styles.metaList}>
            {document.meta.map((item) => (
              <div className={styles.metaRow} key={item.id}>
                <Input aria-label="메타데이터 이름" onChange={(event) => updateMeta(item.id, "label", event.target.value)} value={item.label} />
                <Input aria-label="메타데이터 값" onChange={(event) => updateMeta(item.id, "value", event.target.value)} value={item.value} />
                <IconButton
                  icon="delete"
                  label={`${item.label} 항목 삭제`}
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      meta: current.meta.filter((candidate) => candidate.id !== item.id),
                    }))
                  }
                  size="small"
                  variant="subtle"
                />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.settingsSection}>
          <div className={styles.settingsSectionHeader}>
            <h2>색상 테마</h2>
          </div>
          <div className={styles.themeGrid}>
            {Object.entries(document.theme)
              .filter(([key]) => key !== "meshColors")
              .map(([key, value]) => (
                <Input
                  key={key}
                  label={key}
                  leading={
                    <input
                      aria-label={`${key} 색상 선택`}
                      className={styles.colorSwatchLeading}
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
                  }
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
              ))}
          </div>
        </section>

        <section className={styles.settingsSection}>
          <div className={styles.settingsSectionHeader}>
            <h2>메시 그라디언트 색상</h2>
            <Button
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  theme: {
                    ...current.theme,
                    meshColors: [...(current.theme.meshColors ?? []), "255, 255, 255"],
                  },
                }))
              }
              size="small"
              variant="neutral"
            >
              + 색상 추가
            </Button>
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
                          meshColors: current.theme.meshColors.map((existing, existingIndex) => (existingIndex === index ? event.target.value : existing)),
                        },
                      }),
                      `theme:meshColors:${index}`,
                    )
                  }
                  placeholder="255, 255, 255"
                  value={color}
                />
                <Button
                  aria-label={`메시 색상 ${index + 1} 삭제`}
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      theme: {
                        ...current.theme,
                        meshColors: current.theme.meshColors.filter((_, existingIndex) => existingIndex !== index),
                      },
                    }))
                  }
                  size="small"
                  variant="subtle"
                >
                  삭제
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
