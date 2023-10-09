import {createTheme} from '@uiw/codemirror-themes'
import {tags as t} from '@lezer/highlight'

const BG_DARK = '#111113'
const FG_TEXT = '#ffffff'
const BG_HIGHLIGHT = BG_DARK
const BG_SELECT = '#036dd626'
const FG_CARET = '#ffffff'

export const cmTheme = createTheme({
  theme: 'dark',

  settings: {
    background: BG_DARK,
    backgroundImage: '',
    foreground: FG_TEXT,
    caret: FG_CARET,
    selection: BG_SELECT,
    selectionMatch: BG_SELECT,
    lineHighlight: BG_HIGHLIGHT,
    gutterBackground: BG_DARK,
    gutterForeground: BG_DARK,
    fontFamily: 'IBM Plex Mono, monospace',
  },

  styles: [
    {tag: t.comment, color: FG_TEXT},
    {tag: t.variableName, color: FG_TEXT},
    {tag: [t.string, t.special(t.brace)], color: FG_TEXT},
    {tag: t.number, color: FG_TEXT},
    {tag: t.bool, color: FG_TEXT},
    {tag: t.null, color: FG_TEXT},
    {tag: t.keyword, color: FG_TEXT},
    {tag: t.operator, color: FG_TEXT},
    {tag: t.className, color: FG_TEXT},
    {tag: t.definition(t.typeName), color: FG_TEXT},
    {tag: t.typeName, color: FG_TEXT},
    {tag: t.angleBracket, color: FG_TEXT},
    {tag: t.tagName, color: FG_TEXT},
    {tag: t.attributeName, color: FG_TEXT},
  ],
})
