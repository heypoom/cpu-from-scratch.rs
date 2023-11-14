import { Input, Output, WebMidi, NoteMessageEvent } from "webmidi"

import { ControlCodes } from "./controls"
import { toNote, toSlot } from "./conversion"

import {
  Color,
  Flash,
  Pulse,
  RGB,
  buildSpecFromGrid,
  buildFillGrid,
  getTrait,
} from "./specs"

import { Spec, InputGrid } from "../types/specs"
import { LaunchpadHandler, DeviceListeners, DeviceEvents } from "../types/midi"
import { $midi } from "../../store/midi"

/**
 * High-level helper class to interface with the launchpad hardware.
 */
export class Launchpad {
  // Interface for the 64-button pressure-sensitive areas
  midiIn?: Input
  midiOut?: Output

  // Interface for the 16 control buttons.
  dawIn?: Input
  dawOut?: Output

  // MIDI interface name for the MIDI device
  midiInName = "Launchpad X LPX MIDI Out"
  midiOutName = "Launchpad X LPX MIDI In"

  // MIDI interface name for the DAW device
  dawInName = "Launchpad X LPX DAW Out"
  dawOutName = "Launchpad X LPX DAW In"

  // Has the launchpad module been initialized?
  initialized = false

  // Convert between note value and button position.
  toNote = toNote
  toSlot = toSlot

  // Building blocks for grid payload.
  Color = Color
  Flash = Flash
  Pulse = Pulse
  RGB = RGB

  // Note values for the control buttons
  ControlCodes = ControlCodes

  /**
   * Event listeners for the launchpad.
   */
  listeners: DeviceListeners = {
    controlChange: [],
    noteOn: [],
    noteOff: [],
    dawNoteOn: [],
    dawNoteOff: [],
    update: [],
    clear: [],
    ready: [],
  }

  /**
   * Setup the launchpad device.
   */
  async setup() {
    if (this.initialized) return

    await WebMidi.enable({ sysex: true })
    this.initPorts()
    this.setupListeners()
    this.useProgrammerLayout()
    this.resetControl()
    this.dispatch("ready")

    this.initialized = true
    $midi.setKey("ready", true)

    console.info("Launchpad setup completed.")
  }

  /**
   * Initializes the MIDI ports for the launchpad.
   */
  initPorts() {
    this.midiIn = WebMidi.getInputByName(this.midiInName)
    this.midiOut = WebMidi.getOutputByName(this.midiOutName)
    this.dawIn = WebMidi.getInputByName(this.dawInName)
    this.dawOut = WebMidi.getOutputByName(this.dawOutName)
  }

  /**
   * Adds an event listener to the launchpad.
   *
   * @param event name of the event
   * @param handler callback to invoke when the event occurs.
   */
  on(event: DeviceEvents, handler: LaunchpadHandler) {
    if (!this.listeners[event]) return

    this.listeners[event].push(handler)
  }

  /**
   * Remove an event listener from the launchpad.
   *
   * @param event name of the event
   * @param handler callback to remove.
   */
  off(event: DeviceEvents, handler: LaunchpadHandler) {
    if (!this.listeners[event]) return

    this.listeners[event] = this.listeners[event].filter((h) => h != handler)
  }

  /**
   * Dispatch the event.
   *
   * @param event
   * @param note
   * @param value
   */
  dispatch(event: keyof DeviceListeners, note: number = 0, value: number = 0) {
    if (!this.listeners[event]) return

    // When the event is dispatched, invoke the event listeners.
    for (const listener of this.listeners[event]) {
      listener(note, value)
    }
  }

  /**
   * Initializes the MIDI port event listeners.
   */
  setupListeners() {
    if (!this.midiIn) return
    if (!this.dawIn) return

    this.midiIn.addListener("noteon", (event) =>
      this.sendNoteEvent("noteOn", event),
    )

    this.midiIn.addListener("noteoff", (event) =>
      this.sendNoteEvent("noteOff", event),
    )

    this.midiIn.addListener("controlchange", (event) => {
      if (typeof event.value !== "number") return

      this.dispatch("controlChange", event.controller.number, event.value)
    })

    this.dawIn.addListener("noteon", (event) =>
      this.sendNoteEvent("dawNoteOn", event),
    )

    this.dawIn.addListener("noteoff", (event) =>
      this.sendNoteEvent("dawNoteOff", event),
    )
  }

  sendNoteEvent(key: DeviceEvents, data: NoteMessageEvent) {
    this.dispatch(key, data.note.number, data.rawValue)
  }

  /**
   * Activates the programmer layout on the launchpad.
   */
  useProgrammerLayout() {
    this.cmd(0, 127)
    this.cmd(14, 1)
  }

  /**
   * Sends a data payload via the SysEx interface.
   *
   * @param data the data payload array (value should be between 0-255)
   */
  cmd(...data: number[]) {
    if (!this.dawOut) return

    try {
      this.dawOut.send([240, 0, 32, 41, 2, 12, ...data, 247])
    } catch (error) {
      console.warn("launchpad error:", error)
    }
  }

  /**
   * Alternates between 2 colors.
   *
   * @param n note value
   * @param a first color
   * @param b second color
   */
  flash(n: number, a: number, b: number) {
    this.display(n, Flash(a, b))
  }

  /**
   * Displays the RGB colors. Each note value should be between 0 - 127.
   *
   * @param n note value
   * @param r red value (0 - 127)
   * @param g green value (0 - 127)
   * @param b blue (0 - 127)
   */
  rgb(n: number, r: number, g: number, b: number) {
    this.display(n, RGB(r, g, b))
  }

  /**
   * Pulse the colors rapidly.
   *
   * @param n
   * @param color
   */
  pulse(n: number, color: number) {
    this.display(n, Pulse(color))
  }

  /**
   * Transforms the specs into data payload, and sends it.
   *
   * @param specs
   */
  batch(specs: Spec[]) {
    this.cmd(3, ...specs.flat())
  }

  /**
   * Display the display trait
   *
   * @param note
   * @param trait
   */
  display(note: number, trait: Spec) {
    this.batch([getTrait(note, trait)])
  }

  /**
   * Lights up the pad with the specified solid color.
   *
   * @param note the note position on the launchpad
   * @param color the color number between 0 - 127
   */
  light(note: number, color: number) {
    if (!this.midiOut) return

    this.dispatch("update", note, color)

    this.midiOut.playNote(note, {
      rawAttack: color,
    })
  }

  grid(grid: InputGrid) {
    this.batch(buildSpecFromGrid(grid))
  }

  /**
   * Fills every pad with the specified color.
   */
  fill(color: number | Spec = 0) {
    this.grid(buildFillGrid(color))
  }

  /**
   * Reset the control lights.
   */
  resetControl() {
    Object.values(ControlCodes).forEach((code) => this.light(code, 0))
  }
}

export const launchpad = new Launchpad()

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/** @ts-ignore */
window.launchpad = launchpad