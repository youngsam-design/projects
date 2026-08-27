import styles from "./Icon.module.scss";
import icBraket from "../../assets/icon/ic_braket.svg";
import icCheck from "../../assets/icon/ic_check.svg";
import icChevronDown from "../../assets/icon/ic_chevron-down.svg";
import icChevronRight from "../../assets/icon/ic_chevron-right.svg";
import icCode from "../../assets/icon/ic_code.svg";
import icColumns2 from "../../assets/icon/ic_columns-2.svg";
import icColumns3 from "../../assets/icon/ic_columns-3.svg";
import icCopy from "../../assets/icon/ic_copy.svg";
import icDivider from "../../assets/icon/ic_divider.svg";
import icFlexAlignBottom from "../../assets/icon/ic_flex-align-bottom.svg";
import icFlexAlignLeft from "../../assets/icon/ic_flex-align-left.svg";
import icFlexAlignRight from "../../assets/icon/ic_flex-align-right.svg";
import icFlexAlignTop from "../../assets/icon/ic_flex-align-top.svg";
import icHeading1 from "../../assets/icon/ic_heading-1.svg";
import icHeading2 from "../../assets/icon/ic_heading-2.svg";
import icHeading3 from "../../assets/icon/ic_heading-3.svg";
import icHeading4 from "../../assets/icon/ic_heading-4.svg";
import icHeading5 from "../../assets/icon/ic_heading-5.svg";
import icHeading6 from "../../assets/icon/ic_heading-6.svg";
import icLayers3 from "../../assets/icon/ic_layers-3.svg";
import icListDot from "../../assets/icon/ic_list-dot.svg";
import icListNumbered from "../../assets/icon/ic_list-numbered.svg";
import icPhoto from "../../assets/icon/ic_photo.svg";
import icPlus from "../../assets/icon/ic_plus.svg";
import icRepeat from "../../assets/icon/ic_repeat.svg";
import icSettings from "../../assets/icon/ic_settings.svg";
import icSpacingVertical from "../../assets/icon/ic_spacing-vertical.svg";
import icSquare from "../../assets/icon/ic_square.svg";
import icTrash from "../../assets/icon/ic_trash.svg";
import icType from "../../assets/icon/ic_type.svg";
import icZap from "../../assets/icon/ic_zap.svg";

// Registry of the icon set at src/assets/icon actually wired into components
// so far - add an entry here (rather than importing the raw file elsewhere)
// whenever a new one is used, to keep a single name -> asset mapping.
const icons = {
  add: icPlus,
  bulletList: icListDot,
  callout: icZap,
  caption: icType,
  check: icCheck,
  chevronDown: icChevronDown,
  chevronRight: icChevronRight,
  codeBlock: icCode,
  columns2: icColumns2,
  columns3: icColumns3,
  copy: icCopy,
  delete: icTrash,
  divider: icDivider,
  frame: icSquare,
  frameBottom: icFlexAlignBottom,
  frameLeft: icFlexAlignLeft,
  frameRight: icFlexAlignRight,
  frameTop: icFlexAlignTop,
  heading1: icHeading1,
  heading2: icHeading2,
  heading3: icHeading3,
  heading4: icHeading4,
  heading5: icHeading5,
  heading6: icHeading6,
  media: icPhoto,
  numberedList: icListNumbered,
  quote: icBraket,
  replace: icRepeat,
  settings: icSettings,
  spacer: icSpacingVertical,
  text: icType,
  ungroup: icLayers3,
};

export default function Icon({ className, name }) {
  const src = icons[name];
  if (!src) return null;
  return (
    <span
      aria-hidden="true"
      className={[styles.icon, className].filter(Boolean).join(" ")}
      style={{ WebkitMaskImage: `url("${src}")`, maskImage: `url("${src}")` }}
    />
  );
}
