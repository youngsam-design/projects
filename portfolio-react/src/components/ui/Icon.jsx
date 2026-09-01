import styles from "./Icon.module.scss";
import icArrowLeft from "../../assets/icon/ic_arrow-left.svg";
import icArrowRight from "../../assets/icon/ic_arrow-right.svg";
import icBold from "../../assets/icon/ic_bold.svg";
import icBraket from "../../assets/icon/ic_braket.svg";
import icBrokenLink from "../../assets/icon/ic_broken-link.svg";
import icBrowser from "../../assets/icon/ic_browser.svg";
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
import icGridDots from "../../assets/icon/ic_grid-dots.svg";
import icHeading1 from "../../assets/icon/ic_heading-1.svg";
import icHeading2 from "../../assets/icon/ic_heading-2.svg";
import icHeading3 from "../../assets/icon/ic_heading-3.svg";
import icHeading4 from "../../assets/icon/ic_heading-4.svg";
import icHeading5 from "../../assets/icon/ic_heading-5.svg";
import icHeading6 from "../../assets/icon/ic_heading-6.svg";
import icItalic from "../../assets/icon/ic_italic.svg";
import icLayers3 from "../../assets/icon/ic_layers-3.svg";
import icLink from "../../assets/icon/ic_link.svg";
import icListDot from "../../assets/icon/ic_list-dot.svg";
import icListNumbered from "../../assets/icon/ic_list-numbered.svg";
import icPhoto from "../../assets/icon/ic_photo.svg";
import icPlaySquare from "../../assets/icon/ic_play-square.svg";
import icPlus from "../../assets/icon/ic_plus.svg";
import icRepeat from "../../assets/icon/ic_repeat.svg";
import icSettings from "../../assets/icon/ic_settings.svg";
import icSpacingVertical from "../../assets/icon/ic_spacing-vertical.svg";
import icSquare from "../../assets/icon/ic_square.svg";
import icStrikethrough from "../../assets/icon/ic_strikethrough.svg";
import icSwitchHorizontal from "../../assets/icon/ic_switch-horizontal.svg";
import icTable from "../../assets/icon/ic_table.svg";
import icTrash from "../../assets/icon/ic_trash.svg";
import icType from "../../assets/icon/ic_type.svg";
import icTypeSquare from "../../assets/icon/ic_type-square.svg";
import icUnderline from "../../assets/icon/ic_underline.svg";
import icVolumeX from "../../assets/icon/ic_volume-x.svg";
import icZap from "../../assets/icon/ic_zap.svg";

// Registry of the icon set at src/assets/icon actually wired into components
// so far - add an entry here (rather than importing the raw file elsewhere)
// whenever a new one is used, to keep a single name -> asset mapping.
const icons = {
  add: icPlus,
  arrowLeft: icArrowLeft,
  arrowRight: icArrowRight,
  bold: icBold,
  bulletList: icListDot,
  callout: icTypeSquare,
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
  embed: icBrowser,
  drag: icGridDots,
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
  highlight: icZap,
  italic: icItalic,
  link: icLink,
  loop: icRepeat,
  media: icPhoto,
  mute: icVolumeX,
  numberedList: icListNumbered,
  play: icPlaySquare,
  quote: icBraket,
  replace: icSwitchHorizontal,
  settings: icSettings,
  spacer: icSpacingVertical,
  strike: icStrikethrough,
  table: icTable,
  text: icType,
  underline: icUnderline,
  ungroup: icLayers3,
  unlink: icBrokenLink,
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
