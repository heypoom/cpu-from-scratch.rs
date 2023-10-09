import CodeMirror from "@uiw/react-codemirror"

import { Handle, Position, NodeProps } from "reactflow"

import { useStore } from "@nanostores/react"
import { Extension } from "@uiw/react-codemirror"
import { vim } from "@replit/codemirror-vim"
import { keymap } from "@codemirror/view"

import { Machine } from "../../types/Machine"
import { setSource, runCode } from "../../store/machines"

import { cmTheme } from "../../editor/theme"
import { vasmLanguage } from "../../editor/syntax"
import { $editorConfig, EditorConfig } from "../../store/editor.ts"
import { useMemo } from "react"
import {$output} from "../../store/results.ts";

function getExtensions(m: Machine, config: EditorConfig) {
  const keymaps = keymap.of([
    {
      key: "Enter",
      shift: () => {
        runCode(m.id, m.source)
        return true
      },
    },
  ])

  const extensions: Extension[] = [vasmLanguage, keymaps]

  if (config.vim) extensions.push(vim())

  return extensions
}

export function MachineBlock(props: NodeProps<Machine>) {
  const { id, data } = props
  const { source } = data

  const outputs = useStore($output)

  const state = outputs[id] ?? {}
  const stack = state.stack ? [...state.stack].map((x) => x) : null

  const config = useStore($editorConfig)
  const extensions = useMemo(() => getExtensions(data, config), [data, config])

  return (
    <div className="font-mono bg-slate-1">
      <Handle type="source" position={Position.Left} id="ls" />

      <div className="px-3 py-3 border rounded-2">
        <div className="flex flex-col space-y-2 text-gray-50">
          <div className="min-h-[100px]">
            <div className="nodrag">
              <CodeMirror
                basicSetup={{ lineNumbers: false, foldGutter: false }}
                width="300px"
                maxHeight="400px"
                minWidth="300px"
                maxWidth="600px"
                theme={cmTheme}
                value={source}
                lang="vasm"
                onChange={(s: string) => setSource(id, s)}
                extensions={extensions}
              />
            </div>
          </div>

          {state.error && (
            <div>
              <div className="text-1 text-orange-11">
                <pre>{state.error.stack}</pre>
              </div>
            </div>
          )}

          {state.logs?.length ? (
            <div className="text-cyan-11 text-1 font-medium rounded-sm px-1 bg-stone-800 mx-1">
              {state.logs.map((log, i) => (
                <div key={i}>
                  &gt; {log}
                </div>
              ))}
            </div>
          ) : null}

          {stack && (
            <div className="flex">
              {stack.map((u, i) => (
                <div className="text-1 text-crimson-11 rounded-sm px-1 bg-stone-800 mx-1" key={i}>
                  {u}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Handle type="target" position={Position.Right} id="rt" />
    </div>
  )
}