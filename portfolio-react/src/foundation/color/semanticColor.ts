import { primitiveColor } from "./primitiveColor";

export const semanticColor = {
  neutral: {
    foreground: {
      main: primitiveColor.gray["900"],
      low: primitiveColor.gray["700"],
      lowest: primitiveColor.gray["500"],
      enabled: primitiveColor.gray["300"],
      disabled: primitiveColor.gray["alpha-400"],
      "inverse-main": primitiveColor.white,
      "inverse-disabled": primitiveColor.gray["alpha-inverse-400"],
    },
    background: {
      main: primitiveColor.white,
      lowest: primitiveColor.gray["50"],
      low: primitiveColor.gray["100"],
      high: primitiveColor.gray["200"],
      transparent: primitiveColor.gray["alpha-inverse-0"],
      "hovered-pressed": primitiveColor.gray["alpha-100"],
      "disabled-main": primitiveColor.gray["200"],
      "disabled-low": primitiveColor.gray["100"],
      "inverse-main": primitiveColor.black,
      "inverse-low": primitiveColor.gray["900"],
      "inverse-hovered-pressed": primitiveColor.gray["alpha-inverse-100"],
      "inverse-disabled": primitiveColor.gray["700"],
      "dimmed-main": primitiveColor.gray["alpha-700"],
      "dimmed-low": primitiveColor.gray["alpha-300"],
      "blurred-main": primitiveColor.white["alpha-500"],
    },
    border: {
      main: primitiveColor.gray["alpha-100"],
      high: primitiveColor.gray["alpha-200"],
      highest: primitiveColor.gray["alpha-900"],
      disabled: primitiveColor.gray["alpha-200"],
    },
  },
  primary: {
    foreground: {
      low: primitiveColor.violet["400"],
      main: primitiveColor.violet["600"],
      high: primitiveColor.violet["700"],
      "inverse-main": primitiveColor.white,
    },
    background: {
      main: primitiveColor.violet["600"],
      lowest: primitiveColor.violet["50"],
      low: primitiveColor.violet["100"],
      "hovered-pressed": primitiveColor.violet["alpha-100"],
    },
    border: {
      main: primitiveColor.violet["alpha-600"],
    },
  },
  secondary: {
    foreground: {
      main: primitiveColor.gray["700"],
      low: primitiveColor.gray["400"],
      high: primitiveColor.gray["800"],
      "inverse-main": primitiveColor.white,
    },
    background: {
      main: primitiveColor.gray["800"],
      low: primitiveColor.gray["100"],
      "hovered-pressed": primitiveColor.gray["alpha-100"],
    },
    border: {
      main: primitiveColor.gray["alpha-900"],
    },
  },
  error: {
    foreground: {
      main: primitiveColor.red["600"],
      low: primitiveColor.red["400"],
      high: primitiveColor.red["700"],
      "inverse-main": primitiveColor.white,
    },
    background: {
      main: primitiveColor.red["600"],
      low: primitiveColor.red["100"],
      "hovered-pressed": primitiveColor.red["alpha-100"],
    },
    border: {
      main: primitiveColor.red["alpha-600"],
    },
  },
  success: {
    foreground: {
      main: primitiveColor.green["600"],
      low: primitiveColor.green["400"],
      high: primitiveColor.green["700"],
      "inverse-main": primitiveColor.white,
    },
    background: {
      main: primitiveColor.green["600"],
      low: primitiveColor.green["100"],
      "hovered-pressed": primitiveColor.green["alpha-100"],
    },
    border: {
      main: primitiveColor.green["alpha-600"],
    },
  },
  warning: {
    foreground: {
      main: primitiveColor.orange["600"],
      low: primitiveColor.orange["400"],
      high: primitiveColor.orange["700"],
      "inverse-main": primitiveColor.white,
    },
    background: {
      main: primitiveColor.orange["600"],
      low: primitiveColor.orange["100"],
      "hovered-pressed": primitiveColor.orange["alpha-100"],
    },
    border: {
      main: primitiveColor.orange["alpha-600"],
    },
  },
  info: {
    foreground: {
      main: primitiveColor.blue["600"],
      low: primitiveColor.blue["400"],
      high: primitiveColor.blue["700"],
      "inverse-main": primitiveColor.white,
    },
    background: {
      main: primitiveColor.blue["600"],
      lowest: primitiveColor.blue["50"],
      low: primitiveColor.blue["100"],
      "hovered-pressed": primitiveColor.blue["alpha-100"],
    },
    border: {
      main: primitiveColor.blue["alpha-600"],
    },
  },
  promo: {
    foreground: {
      main: primitiveColor.pink["600"],
      low: primitiveColor.pink["400"],
      high: primitiveColor.pink["700"],
      "inverse-main": primitiveColor.white,
    },
    background: {
      main: primitiveColor.pink["600"],
      lowest: primitiveColor.pink["50"],
      low: primitiveColor.pink["100"],
      "hovered-pressed": primitiveColor.pink["alpha-100"],
    },
    border: {
      main: primitiveColor.pink["alpha-600"],
    },
  },
};
