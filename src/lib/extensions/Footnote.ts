import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface FootnoteOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      /**
       * Set a footnote node
       */
      setFootnote: (attributes: { id: string; content: string; number?: number }) => ReturnType;
    };
  }
}

export const Footnote = Node.create<FootnoteOptions>({
  name: 'footnote',

  group: 'inline',

  inline: true,

  selectable: true,

  draggable: true,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      content: {
        default: '',
      },
      number: {
        default: 1,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-type="footnote"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'sup',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'footnote',
        title: HTMLAttributes.content,
        class: 'inline-flex items-center justify-center w-4 h-4 ml-0.5 rounded-full bg-slate-100 text-indigo-600 text-[9px] font-bold border border-indigo-200 cursor-help transition-colors hover:bg-indigo-100 select-none align-super',
      }),
      `${HTMLAttributes.number}`,
    ];
  },

  addCommands() {
    return {
      setFootnote:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('footnote-numbering'),
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some(tr => tr.docChanged)) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;
          let count = 0;

          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'footnote') {
              count++;
              if (node.attrs.number !== count) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  number: count,
                });
                modified = true;
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
