import { primitiveColor } from "./primitiveColor";

/*
 * light/dark share the exact same set of keys - only which primitive step
 * each key resolves to changes. Nearly every dark value below is derived by
 * one mechanical rule, so a reader can predict it instead of treating each
 * one as a separate design decision:
 *
 *   - Numbered scales (gray/violet/blue/red/green/orange/pink) are reflected
 *     around their midpoint: 50<->950, 100<->900, 200<->800, 300<->700,
 *     400<->600, 500 stays. A step that reads as "high emphasis" against a
 *     light surface (darker, higher number) reads as "high emphasis" against
 *     a dark one at the mirrored (lighter, lower number) step, and vice versa.
 *   - gray's "alpha-N" (a dark tint, meant to sit on a light surface) swaps
 *     with "alpha-inverse-N" (the same N, but a light tint for a dark
 *     surface) - these pairs exist in primitiveColor specifically for this.
 *   - A hue's own "alpha-600"/"alpha-100" (e.g. violet/red/...) are already
 *     colored (not black/white-based), so they read fine on either surface
 *     and are reused unchanged.
 *   - White text on a saturated accent button (*.foreground.inverse-main)
 *     is a near-universal convention and stays white in both themes.
 *
 * The exceptions (called out inline) are cases where the mechanical rule
 * would produce something that doesn't match how the token is actually used:
 * a modal scrim needs to stay a dark tint in both themes to still "dim" the
 * content behind it, and neutral's plain white/black main surfaces are
 * handled explicitly since they aren't a numbered step to reflect.
 */
export const semanticColor = {
  light: {
    neutral: {
      foreground: {
        main: primitiveColor.gray["900"],
        low: primitiveColor.gray["700"],
        lowest: primitiveColor.gray["500"],
        enabled: primitiveColor.gray["300"],
        disabled: primitiveColor.gray["alpha-400"],
        "inverse-main": primitiveColor.white.main,
        "inverse-disabled": primitiveColor.gray["alpha-inverse-400"],
      },
      background: {
        main: primitiveColor.white.main,
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
        "inverse-main": primitiveColor.white.main,
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
        "inverse-main": primitiveColor.white.main,
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
        "inverse-main": primitiveColor.white.main,
      },
      background: {
        main: primitiveColor.red["600"],
        lowest: primitiveColor.red["50"],
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
        "inverse-main": primitiveColor.white.main,
      },
      background: {
        main: primitiveColor.green["600"],
        lowest: primitiveColor.green["50"],
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
        "inverse-main": primitiveColor.white.main,
      },
      background: {
        main: primitiveColor.orange["600"],
        lowest: primitiveColor.orange["50"],
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
        "inverse-main": primitiveColor.white.main,
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
        "inverse-main": primitiveColor.white.main,
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
  },
  dark: {
    neutral: {
      foreground: {
        main: primitiveColor.gray["100"],
        low: primitiveColor.gray["300"],
        lowest: primitiveColor.gray["500"],
        enabled: primitiveColor.gray["700"],
        disabled: primitiveColor.gray["alpha-inverse-400"],
        // Text for a chip whose own background is also inverted (see
        // background["inverse-main"] below) - dark text on what's now a
        // light chip, the mirror of light theme's white-on-dark chip.
        "inverse-main": primitiveColor.gray["900"],
        "inverse-disabled": primitiveColor.gray["alpha-400"],
      },
      background: {
        // Not literal black: a soft near-black surface reads better than
        // pure black (avoids OLED crush / harsh edges against elevated
        // panels), mirroring how light theme's "main" isn't literal gray
        // either - it's the brightest primitive available (white).
        main: primitiveColor.gray["900"],
        lowest: primitiveColor.gray["950"],
        low: primitiveColor.gray["800"],
        high: primitiveColor.gray["700"],
        transparent: primitiveColor.gray["alpha-inverse-0"],
        "hovered-pressed": primitiveColor.gray["alpha-inverse-100"],
        "disabled-main": primitiveColor.gray["800"],
        "disabled-low": primitiveColor.gray["900"],
        "inverse-main": primitiveColor.white.main,
        "inverse-low": primitiveColor.gray["100"],
        "inverse-hovered-pressed": primitiveColor.gray["alpha-100"],
        "inverse-disabled": primitiveColor.gray["300"],
        // A scrim dims whatever's behind it - it needs to stay a dark tint
        // in both themes, not flip to a light one, or it stops reading as
        // "dimmed" against an already-dark surface.
        "dimmed-main": primitiveColor.gray["alpha-700"],
        "dimmed-low": primitiveColor.gray["alpha-300"],
        // Not a reflection of light's white-tinted glass: a frosted panel
        // needs to flip which side it's tinted on, the same way macOS/iOS
        // vibrancy materials switch from light- to dark-vibrancy - a light
        // tint here would keep both the panel AND (now light) text bright,
        // erasing the contrast between them. Mostly opaque so a saturated
        // project background can't still bleed through once blurred+saturated.
        "blurred-main": primitiveColor.gray["alpha-900"],
      },
      border: {
        main: primitiveColor.gray["alpha-inverse-100"],
        high: primitiveColor.gray["alpha-inverse-200"],
        highest: primitiveColor.gray["alpha-inverse-900"],
        disabled: primitiveColor.gray["alpha-inverse-200"],
      },
    },
    primary: {
      foreground: {
        low: primitiveColor.violet["600"],
        main: primitiveColor.violet["400"],
        high: primitiveColor.violet["300"],
        "inverse-main": primitiveColor.white.main,
      },
      background: {
        main: primitiveColor.violet["400"],
        lowest: primitiveColor.violet["950"],
        low: primitiveColor.violet["900"],
        "hovered-pressed": primitiveColor.violet["alpha-100"],
      },
      border: {
        main: primitiveColor.violet["alpha-600"],
      },
    },
    secondary: {
      foreground: {
        main: primitiveColor.gray["300"],
        low: primitiveColor.gray["600"],
        high: primitiveColor.gray["200"],
        // Unlike primary/error/etc., secondary's background is a plain gray
        // step, and that step flips from dark (800) to light (200) below -
        // so its button text has to flip too, or it'd be light-on-light.
        "inverse-main": primitiveColor.gray["900"],
      },
      background: {
        main: primitiveColor.gray["200"],
        low: primitiveColor.gray["900"],
        "hovered-pressed": primitiveColor.gray["alpha-inverse-100"],
      },
      border: {
        main: primitiveColor.gray["alpha-inverse-900"],
      },
    },
    error: {
      foreground: {
        main: primitiveColor.red["400"],
        low: primitiveColor.red["600"],
        high: primitiveColor.red["300"],
        "inverse-main": primitiveColor.white.main,
      },
      background: {
        main: primitiveColor.red["400"],
        lowest: primitiveColor.red["950"],
        low: primitiveColor.red["900"],
        "hovered-pressed": primitiveColor.red["alpha-100"],
      },
      border: {
        main: primitiveColor.red["alpha-600"],
      },
    },
    success: {
      foreground: {
        main: primitiveColor.green["400"],
        low: primitiveColor.green["600"],
        high: primitiveColor.green["300"],
        "inverse-main": primitiveColor.white.main,
      },
      background: {
        main: primitiveColor.green["400"],
        lowest: primitiveColor.green["950"],
        low: primitiveColor.green["900"],
        "hovered-pressed": primitiveColor.green["alpha-100"],
      },
      border: {
        main: primitiveColor.green["alpha-600"],
      },
    },
    warning: {
      foreground: {
        main: primitiveColor.orange["400"],
        low: primitiveColor.orange["600"],
        high: primitiveColor.orange["300"],
        "inverse-main": primitiveColor.white.main,
      },
      background: {
        main: primitiveColor.orange["400"],
        lowest: primitiveColor.orange["950"],
        low: primitiveColor.orange["900"],
        "hovered-pressed": primitiveColor.orange["alpha-100"],
      },
      border: {
        main: primitiveColor.orange["alpha-600"],
      },
    },
    info: {
      foreground: {
        main: primitiveColor.blue["400"],
        low: primitiveColor.blue["600"],
        high: primitiveColor.blue["300"],
        "inverse-main": primitiveColor.white.main,
      },
      background: {
        main: primitiveColor.blue["400"],
        lowest: primitiveColor.blue["950"],
        low: primitiveColor.blue["900"],
        "hovered-pressed": primitiveColor.blue["alpha-100"],
      },
      border: {
        main: primitiveColor.blue["alpha-600"],
      },
    },
    promo: {
      foreground: {
        main: primitiveColor.pink["400"],
        low: primitiveColor.pink["600"],
        high: primitiveColor.pink["300"],
        "inverse-main": primitiveColor.white.main,
      },
      background: {
        main: primitiveColor.pink["400"],
        lowest: primitiveColor.pink["950"],
        low: primitiveColor.pink["900"],
        "hovered-pressed": primitiveColor.pink["alpha-100"],
      },
      border: {
        main: primitiveColor.pink["alpha-600"],
      },
    },
  },
};
