import { Button } from "@radix-ui/themes"
import { useStore } from "@nanostores/react"
import { PauseIcon, PlayIcon } from "@radix-ui/react-icons"

import { $status } from "../store/status"

import { manager } from "../core"
import { $hasBlocks } from "../store/nodes"

export const RunButton = () => {
  const status = useStore($status)
  const hasBlocks = useStore($hasBlocks)

  if (status.running)
    return (
      <Button
        color="tomato"
        variant="soft"
        onClick={() => (manager.pause = true)}
        className="font-semibold"
      >
        <PauseIcon />
        Pause
      </Button>
    )

  return (
    <Button
      color="green"
      variant="soft"
      onClick={manager.run}
      className="font-semibold"
      disabled={!hasBlocks}
    >
      <PlayIcon />
      Run
    </Button>
  )
}