import { Node, mergeAttributes } from '@tiptap/core'
import katex from 'katex'

export interface MathematicsOptions {
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathematics: {
      /**
       * Set a mathematics node
       */
      setMathematics: (options: { latex: string }) => ReturnType,
    }
  }
}

export const Mathematics = Node.create<MathematicsOptions>({
  name: 'mathematics',

  group: 'inline',

  inline: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'science-math',
      },
    }
  },

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: element => element.getAttribute('data-latex'),
        renderHTML: attributes => {
          return {
            'data-latex': attributes.latex,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-latex]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.attrs.latex || ''
    let html = ''
    try {
      html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
      })
    } catch (e) {
      html = `<span class="math-error">${latex}</span>`
    }

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'contenteditable': 'false',
      }),
      ['span', { innerHTML: html }],
    ]
  },

  addCommands() {
    return {
      setMathematics: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-e': () => this.editor.commands.setMathematics({ latex: 'x = ' }),
    }
  },
})
