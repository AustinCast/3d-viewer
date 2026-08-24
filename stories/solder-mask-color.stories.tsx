import { useMemo } from "react"
import { CadViewer } from "src/CadViewer"
import complexBoardCircuitJson from "./assets/complex-board.json"

type SoldermaskColor =
  | "green"
  | "red"
  | "blue"
  | "purple"
  | "black"
  | "white"
  | "yellow"

const SOLDER_MASK_STORY_ELEMENT_TYPES = new Set([
  "pcb_board",
  "pcb_component",
  "pcb_smtpad",
  "pcb_trace",
  "pcb_via",
  "pcb_plated_hole",
  "pcb_hole",
  "pcb_copper_pour",
  "pcb_silkscreen_path",
  "pcb_silkscreen_text",
])

const soldermaskColorsCircuitJson = complexBoardCircuitJson.filter(
  (circuitElement) => SOLDER_MASK_STORY_ELEMENT_TYPES.has(circuitElement.type),
)

const getCircuitJsonWithSoldermaskColor = (solderMaskColor: SoldermaskColor) =>
  soldermaskColorsCircuitJson.map((circuitElement) =>
    circuitElement.type === "pcb_board"
      ? { ...circuitElement, solder_mask_color: solderMaskColor }
      : circuitElement,
  )

const SoldermaskColorExample = ({
  solderMaskColor,
}: {
  solderMaskColor: SoldermaskColor
}) => {
  const circuitJson = useMemo(
    () => getCircuitJsonWithSoldermaskColor(solderMaskColor),
    [solderMaskColor],
  )

  return <CadViewer circuitJson={circuitJson} autoRotateDisabled />
}

export const Green = () => <SoldermaskColorExample solderMaskColor="green" />

export const Red = () => <SoldermaskColorExample solderMaskColor="red" />

export const Blue = () => <SoldermaskColorExample solderMaskColor="blue" />

export const Purple = () => <SoldermaskColorExample solderMaskColor="purple" />

export const Black = () => <SoldermaskColorExample solderMaskColor="black" />

export const White = () => <SoldermaskColorExample solderMaskColor="white" />

export const Yellow = () => <SoldermaskColorExample solderMaskColor="yellow" />

export default {
  title: "Soldermask Colors/Examples",
  component: SoldermaskColorExample,
}
