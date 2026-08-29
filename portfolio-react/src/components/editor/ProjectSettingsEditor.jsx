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

const themeColorLabels = {
  accentColor: "Accent Color",
  mainBackgroundColor: "Main Background Color",
  mainForegroundColor: "Main Foreground Color",
  accentActiveColor: "Accent Active Color",
  subBackgroundColor: "Sub Background Color",
  subForegroundColor: "Sub Foreground Color",
};

export default function ProjectSettingsEditor({ document, onChange }) {
  const updateMeta = (id, field, value) =>
    onChange(
      (current) => ({
        ...current,
        meta: current.meta.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      }),
      `meta:${id}:${field}`,
    );

  const renderColorInput = (key, value) => (
    <Input
      key={key}
      label={themeColorLabels[key] ?? key}
      leading={
        <input
          aria-label={`${key} 색상 선택`}
          className={styles.colorSwatchLeading}
          onChange={(event) =>
            onChange(
              (current) => ({
                ...current,
                theme: { ...current.theme, [key]: hexToRgbString(event.target.value) },
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
            theme: { ...current.theme, [key]: event.target.value },
          }),
          `theme:${key}`,
        )
      }
      placeholder="255, 255, 255"
      value={value}
    />
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
            <div className={styles.accentColorField}>
              <Checkbox
                checked={document.theme.accentColor !== undefined}
                label="Accent Color 사용"
                onChange={(event) =>
                  onChange(
                    (current) => {
                      const nextTheme = { ...current.theme };
                      if (event.target.checked) {
                        nextTheme.accentColor = current.theme.mainForegroundColor ?? "0, 0, 0";
                      } else {
                        delete nextTheme.accentColor;
                      }
                      return { ...current, theme: nextTheme };
                    },
                    "theme:accentColor:enabled",
                  )
                }
              />
              {document.theme.accentColor !== undefined && renderColorInput("accentColor", document.theme.accentColor)}
            </div>
            {Object.entries(document.theme)
              .filter(([key]) => key !== "accentColor")
              .map(([key, value]) => renderColorInput(key, value))}
          </div>
        </section>
      </div>
    </div>
  );
}
