import { Icon } from "@iconify/react"
import { useStore } from "@nanostores/react"
import { Tooltip } from "@radix-ui/themes"
import cn from "classnames"
import { memo } from "react"

import { BaseBlock, createSchema } from "@/blocks"
import { ValueRenderer } from "@/blocks/value-view/components/ValueRenderer"
import {
  $remoteValues,
  $selectingRegionViewerId,
  updateValueViewers,
} from "@/store/remote-values"
import { BlockPropsOf } from "@/types/Node"

type Props = BlockPropsOf<"ValueView">

const hx = (n: number) => n.toString(16).padStart(4, "0").toUpperCase()

export const ValueViewBlock = memo((props: Props) => {
  const { id, target, offset, size, visual } = props.data

  const valueMap = useStore($remoteValues)
  const values = valueMap[id] ?? []

  const selectingViewerId = useStore($selectingRegionViewerId)

  const footer = () => {
    return (
      <div className="flex items-center justify-end w-full">
        <Tooltip content="select row regions">
          <Icon
            icon="material-symbols:select-all"
            className={cn(
              "text-2 text-white cursor-pointer hover:text-cyan-9",
              selectingViewerId === id && "text-cyan-11",
            )}
            onClick={() => {
              $selectingRegionViewerId.set(selectingViewerId === id ? null : id)
            }}
          />
        </Tooltip>
      </div>
    )
  }

  return (
    <BaseBlock
      node={props}
      className={cn(
        "relative font-mono",
        id === selectingViewerId && "!border-cyan-10",
      )}
      schema={schema}
      settingsConfig={{
        onUpdate: updateValueViewers,
        className: "px-3 pb-2",
        footer,
      }}
    >
      <ValueRenderer {...{ values, visual, target, offset }} />

      <div className="text-[8px] text-gray-8 absolute font-mono bottom-[-16px] flex min-w-[100px]">
        o=0x{hx(offset)} s={size} t={target}
      </div>
    </BaseBlock>
  )
})

const schema = createSchema({
  type: "ValueView",
  fields: [
    {
      key: "visual",
      type: "select",
      options: [
        { key: "Int", title: "Number" },
        { key: "Bytes", title: "Hex" },
        { key: "Switches", title: "Switch", defaults: { bits: [] } },
        { key: "ColorGrid", title: "Binary Grid" },
        { key: "String" },
      ],
    },

    { key: "size", type: "number", min: 1 },
    { key: "offset", type: "number", min: 0 },
    { key: "target", type: "number", min: 0 },
  ],
})
