import { expect, test } from "bun:test"
import type { Geom3 } from "@jscad/modeling/src/geometries/types"
import type { AnyCircuitElement } from "circuit-json"
import { JSDOM } from "jsdom"
import * as THREE from "three"
import { BoardGeomBuilder } from "../src/BoardGeomBuilder"
import { convertCircuitJsonTo3dSvg } from "../src/convert-circuit-json-to-3d-svg"
import { createSimplifiedBoardGeom } from "../src/soup-to-3d"
import { createBoardMaterial } from "../src/utils/create-board-material"
import { getBoardEdgeColor } from "../src/utils/get-board-edge-color"
import { applyJsdomShim } from "../src/utils/jsdom-shim"

const toSrgbHex = (color: THREE.Color) =>
  `#${color.getHexString(THREE.SRGBColorSpace)}`

test("uses explicit soldermask presets for board edges", () => {
  const expectedColors = {
    red: "#650202",
    blue: "#003f7d",
    purple: "#4c1d69",
    black: "#071014",
    white: "#dddddd",
    yellow: "#dcc84a",
  }

  for (const [solderMaskColor, expectedColor] of Object.entries(
    expectedColors,
  )) {
    const edgeColor = getBoardEdgeColor({
      material: "fr4",
      solder_mask_color: solderMaskColor,
    })
    expect(toSrgbHex(edgeColor)).toBe(expectedColor)
  }
})

test("preserves legacy edges for default and unsupported colors", () => {
  for (const solderMaskColor of [
    undefined,
    "green",
    "not_specified",
    "kicad:custom_solder_mask",
  ]) {
    const edgeColor = getBoardEdgeColor({
      material: "fr4",
      solder_mask_color: solderMaskColor,
    })
    expect(toSrgbHex(edgeColor)).toBe("#103a26")
  }

  const fr1EdgeColor = getBoardEdgeColor({ material: "fr1" })
  expect([fr1EdgeColor.r, fr1EdgeColor.g, fr1EdgeColor.b]).toEqual([
    0.8, 0.4, 0.2,
  ])
})

test("uses custom CSS soldermask colors for board edges", () => {
  const edgeColor = getBoardEdgeColor({
    material: "fr4",
    solder_mask_color: "#123456",
  })

  expect(toSrgbHex(edgeColor)).toBe("#123456")
})

test("keeps the FR4 physical material while applying its edge color", () => {
  const edgeColor = getBoardEdgeColor({
    material: "fr4",
    solder_mask_color: "red",
  })
  const material = createBoardMaterial({
    material: "fr4",
    color: edgeColor,
  })

  if (!(material instanceof THREE.MeshPhysicalMaterial)) {
    throw new Error("Expected the FR4 physical material")
  }

  expect(toSrgbHex(material.color)).toBe("#650202")
  expect(material.roughness).toBe(0.48)
  expect(material.specularIntensity).toBe(0.3)
  expect(material.ior).toBe(1.45)
  expect(material.clearcoat).toBe(0.16)
})

test("uses the first panel board color in simplified and detailed geometry", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_panel",
      pcb_panel_id: "panel",
      width: 20,
      height: 10,
      center: { x: 0, y: 0 },
      thickness: 1.6,
      covered_with_solder_mask: true,
    },
    {
      type: "pcb_board",
      pcb_board_id: "board",
      pcb_panel_id: "panel",
      width: 8,
      height: 6,
      center: { x: 0, y: 0 },
      thickness: 1.6,
      material: "fr4",
      num_layers: 2,
      solder_mask_color: "purple",
    },
  ]
  const expectedColor = getBoardEdgeColor({
    material: "fr4",
    solder_mask_color: "purple",
  })
  const expectedChannels: [number, number, number, number] = [
    expectedColor.r,
    expectedColor.g,
    expectedColor.b,
    1,
  ]

  expect(createSimplifiedBoardGeom(circuitJson)[0]?.color).toEqual(
    expectedChannels,
  )

  let detailedGeometries: Geom3[] = []
  const builder = new BoardGeomBuilder(circuitJson, (geometries) => {
    detailedGeometries = geometries
  })
  expect(builder.step(10)).toBeTrue()
  expect(detailedGeometries[0]?.color).toEqual(expectedChannels)
})

test("uses the first panel board color in SVG output", async () => {
  applyJsdomShim(new JSDOM())
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "unrelated-board",
      center: { x: 30, y: 30 },
      width: 5,
      height: 5,
      thickness: 1.6,
      material: "fr4",
      num_layers: 2,
      solder_mask_color: "red",
    },
    {
      type: "pcb_panel",
      pcb_panel_id: "panel",
      center: { x: 0, y: 0 },
      width: 20,
      height: 10,
      thickness: 1.6,
      covered_with_solder_mask: true,
    },
    {
      type: "pcb_board",
      pcb_board_id: "panel-board",
      pcb_panel_id: "panel",
      center: { x: 0, y: 0 },
      width: 8,
      height: 6,
      thickness: 1.6,
      material: "fr4",
      num_layers: 2,
      solder_mask_color: "purple",
    },
  ]

  const svg = await convertCircuitJsonTo3dSvg(circuitJson, {
    width: 200,
    height: 120,
    zoom: 6,
    camera: {
      position: { x: 0, y: 0, z: 100 },
      lookAt: { x: 0, y: 0, z: 0 },
    },
  })

  expect(svg).toContain("rgb(76,29,105)")
  expect(svg).not.toContain("rgb(101,2,2)")
})
