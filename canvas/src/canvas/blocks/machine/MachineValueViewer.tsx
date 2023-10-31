import { useStore } from "@nanostores/react"

import { ErrorIndicator } from "./ErrorIndicator"

import { $output } from "../../../store/results"

interface Props {
  id: number
}

export const MachineValueViewer = (props: Props) => {
  const { id } = props

  const outputs = useStore($output)

  const state = outputs[id] ?? {}
  const { registers } = state
  const stack = state.stack ? [...state.stack].map((x) => x) : null

  return (
    <div>
      {state.error && (
        <div className="text-1 text-orange-11">
          <ErrorIndicator error={state.error} />
        </div>
      )}

      {state.logs?.length ? (
        <div className="text-cyan-11 text-1 font-medium rounded-sm px-1 bg-stone-800 mx-1">
          {state.logs.map((log, i) => (
            <div key={i}>&gt; {log}</div>
          ))}
        </div>
      ) : null}

      {registers && (
        <div className="text-green-11 text-1 rounded-sm px-1 bg-stone-800 mx-1 flex gap-x-2">
          <div>
            <span>PC</span> <strong>{registers.pc}</strong>
          </div>

          <div>
            <span>SP</span> <strong>{registers.sp}</strong>
          </div>

          <div>
            <span>FP</span> <strong>{registers.fp}</strong>
          </div>

          <div>
            <span>ID</span> <strong>{id}</strong>
          </div>
        </div>
      )}

      {stack && (
        <div className="flex">
          {stack.map((u, i) => (
            <div
              className="text-1 text-crimson-11 rounded-sm px-1 bg-stone-800 mx-1"
              key={i}
            >
              {u}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
