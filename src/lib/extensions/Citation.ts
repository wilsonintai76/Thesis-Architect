import { Node, mergeAttributes } from '@tiptap/core';

export interface CitationOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citation: {
      /**
       * Set a citation node
       */
      setCitation: (attributes: { sourceId: string; label: string }) => ReturnType;
    };
  }
}

export const Citation = Node.create<CitationOptions>({
  name: 'citation',

  group: 'inline',

  inline: true,

  selectable: true,

  draggable: true,

  atom: true,

  addAttributes() {
    return {
      sourceId: {
        default: null,
      },
      label: {
        default: 'Citation',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="citation"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'citation',
        class: 'inline-flex items-center px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-900 text-xs font-medium border border-zinc-200 cursor-pointer hover:bg-zinc-200 transition-colors mx-0.5 select-none',
      }),
      `[${HTMLAttributes.label}]`,
    ];
  },

  addCommands() {
    return {
      setCitation:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
