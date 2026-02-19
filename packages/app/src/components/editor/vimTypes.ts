import type { editor } from 'monaco-editor'

export interface VimRegisterController {
  pushText: (
    register: string,
    type: string,
    text: string,
    linewise: boolean,
    blockwise: boolean
  ) => void
}

export interface VimState {
  vim: {
    visualBlock: boolean
  }
}

export interface CodeMirrorAdapter {
  getSelection: () => string
  state: VimState
  readonly editor: editor.IStandaloneCodeEditor
}

export interface VimOperatorArgs {
  registerName: string
  linewise: boolean
  after?: boolean
}

export interface VimAPI {
  defineOperator: (
    name: string,
    fn: (
      cm: CodeMirrorAdapter,
      args: VimOperatorArgs,
      ranges: unknown,
      oldAnchor: unknown
    ) => unknown
  ) => void
  defineAction: (
    name: string,
    fn: (cm: CodeMirrorAdapter, args: VimOperatorArgs) => Promise<void> | void
  ) => void
  getRegisterController: () => VimRegisterController
  handleKey: (cm: CodeMirrorAdapter, key: string) => void
  mapCommand: (
    command: string,
    type: 'action' | 'operator' | 'motion',
    name: string,
    args?: Record<string, unknown>,
    extra?: Record<string, unknown>
  ) => void
  defineMotion: (
    name: string,
    fn: (
      cm: CodeMirrorAdapter,
      head: { line: number; ch: number },
      motionArgs: { repeat?: number; forward?: boolean }
    ) => { line: number; ch: number } | void
  ) => void
}

export interface VimModeModule {
  Vim: VimAPI
}
