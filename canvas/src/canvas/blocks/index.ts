import { PixelBlockView } from "./PixelBlock"
import { MachineBlockView } from "./machine/MachineBlock"

import { BlockComponentMap } from "../../types/Node"

export const nodeTypes: BlockComponentMap = {
  machine: MachineBlockView,
  pixel: PixelBlockView,
}