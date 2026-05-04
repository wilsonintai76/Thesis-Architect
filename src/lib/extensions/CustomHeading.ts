import Heading from '@tiptap/extension-heading';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return { id: attributes.id };
        },
      },
    };
  },
  
  addProseMirrorPlugins() {
    return [
      ...this.parent?.() || [],
      new Plugin({
        key: new PluginKey('heading-id-generator'),
        appendTransaction: (transactions, oldState, newState) => {
          let modified = false;
          const tr = newState.tr;
          
          if (!transactions.some(transaction => transaction.docChanged)) {
            return null;
          }

          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'heading') {
              if (!node.attrs.id) {
                const text = node.textContent.trim();
                const slug = text
                  ? text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                  : 'section';
                
                // Add a unique suffix to avoid collisions
                const id = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
                
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  id
                });
                modified = true;
              }
            }
          });

          return modified ? tr : null;
        }
      })
    ];
  }
});
