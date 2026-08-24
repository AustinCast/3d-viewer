import * as THREE from "three"

/** Non-green preset colors accepted by the board solderMaskColor prop. */
export const SOLDERMASK_PRESET_HEX = {
  red: "#650202",
  blue: "#003f7d",
  purple: "#4c1d69",
  black: "#071014",
  white: "#dddddd",
  yellow: "#dcc84a",
} as const

const DEFAULT_SOLDERMASK_OPACITY = 0.875

const CSS_HEX_COLOR_PATTERN = /^#(?:[\da-f]{3}|[\da-f]{6})$/i
const CSS_RGB_INTEGER_PATTERN = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i
const CSS_RGB_PERCENT_PATTERN = /^rgb\(\s*\d+%\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i
const CSS_HSL_PATTERN =
  /^hsl\(\s*\d*\.?\d+\s*,\s*\d*\.?\d+%\s*,\s*\d*\.?\d+%\s*\)$/i

type SoldermaskColorPreset = keyof typeof SOLDERMASK_PRESET_HEX

const SOLDERMASK_PRESET_OPACITY: Partial<
  Record<SoldermaskColorPreset, number>
> = {
  blue: 0.96,
  purple: 0.96,
  black: 0.99,
  yellow: 0.92,
}

/**
 * Resolves an explicitly requested non-green mask color. Presets use their
 * calibrated display colors, while Three-supported CSS colors remain
 * supported. Green, missing, not_specified, and unsupported strings return
 * null so callers preserve their material-based legacy color.
 */
export const resolveSoldermaskColor = (
  requestedColor?: string | null,
): THREE.Color | null => {
  const normalizedColor = requestedColor?.trim()
  if (!normalizedColor) {
    return null
  }

  const lowercaseColor = normalizedColor.toLowerCase()
  if (lowercaseColor === "green" || lowercaseColor === "not_specified") {
    return null
  }

  const presetName = lowercaseColor as SoldermaskColorPreset
  const presetColor = SOLDERMASK_PRESET_HEX[presetName]
  if (presetColor) return new THREE.Color(presetColor)

  const isCssColor =
    Object.hasOwn(THREE.Color.NAMES, lowercaseColor) ||
    CSS_HEX_COLOR_PATTERN.test(normalizedColor) ||
    CSS_RGB_INTEGER_PATTERN.test(normalizedColor) ||
    CSS_RGB_PERCENT_PATTERN.test(normalizedColor) ||
    CSS_HSL_PATTERN.test(normalizedColor)

  return isCssColor ? new THREE.Color(lowercaseColor) : null
}

export const resolveSoldermaskOpacity = (
  requestedColor?: string | null,
): number => {
  const presetName = requestedColor
    ?.trim()
    .toLowerCase() as SoldermaskColorPreset
  return SOLDERMASK_PRESET_OPACITY[presetName] ?? DEFAULT_SOLDERMASK_OPACITY
}

/** Match yellow mask pixels before the existing copper-color heuristic. */
export const isYellowSoldermaskColor = ({
  red,
  green,
  blue,
}: {
  red: number
  green: number
  blue: number
}): boolean =>
  Math.hypot(red - 220, green - 200, blue - 74) < 4 ||
  Math.hypot(red - 218, green - 197, blue - 76) < 4

export const compositeSoldermaskOverCopper = ({
  soldermaskColor,
  copperColor,
  soldermaskOpacity,
}: {
  soldermaskColor: THREE.Color
  copperColor: THREE.Color
  soldermaskOpacity: number
}): THREE.Color =>
  soldermaskColor
    .clone()
    .multiplyScalar(soldermaskOpacity)
    .add(copperColor.clone().multiplyScalar(1 - soldermaskOpacity))

export const soldermaskColorToCss = (color: THREE.Color): string => {
  const displayColor = color.clone().convertLinearToSRGB()
  const channels = [
    Math.round(displayColor.r * 255),
    Math.round(displayColor.g * 255),
    Math.round(displayColor.b * 255),
  ]
  return `rgb(${channels.join(",")})`
}
