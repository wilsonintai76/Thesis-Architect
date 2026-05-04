import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ScientificList } from '../../components/ScientificList';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    scientificLists: {
      /**
       * Insert a scientific list (Figures, Tables, etc)
       */
      insertScientificList: (attributes: { type: 'figure' | 'table' | 'equation' | 'symbol' }) => ReturnType,
    }
  }
}

export const ScientificLists = Node.create({
  name: 'scientificList',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: 'figure',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => ({ 'data-type': attributes.type }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="scientific-list"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'scientific-list', class: 'scientific-list-wrapper' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ScientificList);
  },

  addCommands() {
    return {
      insertScientificList:
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
