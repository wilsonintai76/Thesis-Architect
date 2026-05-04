import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { EditorTOC } from '../../components/EditorTOC';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableOfContents: {
      /**
       * Insert a table of contents
       */
      insertTableOfContents: () => ReturnType,
    }
  }
}

export const TableOfContents = Node.create({
  name: 'tableOfContents',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toc"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toc', class: 'table-of-contents-wrapper' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditorTOC);
  },

  addCommands() {
    return {
      insertTableOfContents:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },
});
