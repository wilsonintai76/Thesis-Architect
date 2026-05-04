import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export type CaptionType = 'figure' | 'table' | 'equation';

export interface CaptionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    caption: {
      /**
       * Set a caption
       */
      setCaption: (attributes: { type: CaptionType; label?: string; style?: string }) => ReturnType;
    };
  }
}

export const Caption = Node.create<CaptionOptions>({
  name: 'caption',
  group: 'block',
  content: 'inline*',
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: 'figure',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => ({ 'data-type': attributes.type }),
      },
      label: {
        default: '',
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => ({ 'data-label': attributes.label }),
      },
      number: {
        default: '1',
        parseHTML: element => element.getAttribute('data-number'),
        renderHTML: attributes => ({ 'data-number': attributes.number }),
      },
      style: {
        default: 'apa',
        parseHTML: element => element.getAttribute('data-style'),
        renderHTML: attributes => ({ 'data-style': attributes.style }),
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="caption"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { type, number, style } = node.attrs;
    
    // Custom label logic for equations
    let label = '';
    if (type === 'figure') {
      label = style === 'ieee' ? 'Fig.' : 'Figure';
    } else if (type === 'table') {
      label = style === 'ieee' ? 'TABLE' : 'Table';
    } else if (type === 'equation') {
      label = style === 'ieee' ? '' : 'Equation';
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, { 
        'data-type': 'caption',
        class: `academic-caption type-${type} style-${style}` 
      }),
      ['span', { class: 'caption-label' }, type === 'equation' && style === 'ieee' ? `(${number})` : `${label} ${number}`],
      ['span', { class: 'caption-separator' }, (type === 'equation' && style === 'ieee') ? '' : (style === 'ieee' ? '. ' : ': ')],
      ['span', { class: 'caption-content' }, 0],
    ];
  },

  addCommands() {
    return {
      setCaption: (attributes) => ({ commands }) => {
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
        key: new PluginKey('caption-numbering'),
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some(tr => tr.docChanged)) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;

          let currentH1Index = 0;
          let figureCountInH1 = 0;
          let tableCountInH1 = 0;
          let equationCountInH1 = 0;

          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'heading' && node.attrs.level === 1) {
              currentH1Index++;
              figureCountInH1 = 0;
              tableCountInH1 = 0;
              equationCountInH1 = 0;
            } else if (node.type.name === 'caption') {
              const type = node.attrs.type;
              let newNumber = '';

              if (type === 'figure') {
                figureCountInH1++;
                newNumber = currentH1Index > 0 ? `${currentH1Index}.${figureCountInH1}` : `${figureCountInH1}`;
              } else if (type === 'table') {
                tableCountInH1++;
                newNumber = currentH1Index > 0 ? `${currentH1Index}.${tableCountInH1}` : `${tableCountInH1}`;
              } else if (type === 'equation') {
                equationCountInH1++;
                newNumber = currentH1Index > 0 ? `${currentH1Index}.${equationCountInH1}` : `${equationCountInH1}`;
              }

              if (node.attrs.number !== newNumber) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  number: newNumber,
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
