/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ControlChangeMessageEvent,
  Input,
  InputEventMap,
  NoteMessageEvent,
  Output,
  WebMidi,
} from "webmidi"

import { MidiInputEvent } from "../types/enums"
import { FirstArg, UnionToIntersection } from "../types/helper"
import { launchpad } from "."
import { $midi } from "../store/midi"

// Maps the event names from WebAssembly to the event names in the MIDI spec.
const nameMap = {
  NoteOn: "noteon",
  NoteOff: "noteoff",
  ControlChange: "controlchange",
} satisfies Record<MidiInputEvent, keyof InputEventMap>

type NameMap = typeof nameMap

// Get the possible MIDI events that our canvas can listen to.
export type MidiEvent = FirstArg<InputEventMap[NameMap[keyof NameMap]]>

interface MidiListener<E extends MidiInputEvent = MidiInputEvent> {
  type: E
  channels: number[]
  port: number
  handle: UnionToIntersection<InputEventMap[NameMap[E]]>
}

export const isControlChangeEvent = (
  e: MidiEvent,
): e is ControlChangeMessageEvent => "controller" in e

export const isNoteEvent = (e: MidiEvent): e is NoteMessageEvent => "note" in e

export class MidiManager {
  initialized = false

  /** Mapping of MIDI event listeners */
  midiListeners: Map<number, MidiListener> = new Map()

  inputs: Input[] = []
  outputs: Output[] = []

  async setup() {
    if (this.initialized) return

    await WebMidi.enable({ sysex: true })
    this.inputs = WebMidi.inputs
    this.outputs = WebMidi.outputs

    $midi.set({
      ready: true,
      inputs: this.inputs.map((input) => input.name),
      outputs: this.outputs.map((output) => output.name),
    })

    // Setup novation launchpad
    await launchpad.setup()

    this.initialized = true
  }

  async on<L extends MidiListener>(id: number, listener: L) {
    if (this.midiListeners.has(id)) this.off(id)

    await this.setup()

    const { port, channels } = listener
    const input = this.inputs[port]
    console.log("using port:", port, input?.name)

    if (!input) return

    const type = nameMap[listener.type]

    input.addListener(type, listener.handle, {
      // If channels filter are empty, we accept all channels.
      ...(channels?.length > 0 && { channels }),
    })

    this.midiListeners.set(id, listener)
  }

  off(id: number) {
    if (!this.midiListeners.has(id)) return

    const listener = this.midiListeners.get(id)
    if (!listener) return

    const { handle, port, channels } = listener
    const input = this.inputs[port]
    if (!input) return

    const type = nameMap[listener.type]

    input.removeListener(type, handle, {
      // Only remove by channel if the channel filter is defined.
      ...(channels?.length > 0 && { channels }),
    })

    this.midiListeners.delete(id)
  }
}

export const midiManager = new MidiManager()
