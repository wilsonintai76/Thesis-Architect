import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  AlignmentType, PageBreak, BookmarkStart, BookmarkEnd,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  SimpleField, TableOfContents
} from 'docx';
import { saveAs } from 'file-saver';
import { Source } from '../types';
import { STYLE_PROFILES, StyleProfile } from '../constants/styleProfiles';

let bookmarkIdCounter = 0;

/**
 * Creates an academic figure caption with automatic SEQ numbering and bookmarking
 */
export function createFigureCaption(text: string, id: string, profile: StyleProfile) {
  const bId = bookmarkIdCounter++;
  const style = profile.captions.figure;
  return new Paragraph({
    children: [
      new BookmarkStart(`fig_${id}`, bId),
      new TextRun({ text: 'Figure ', bold: style.bold }),
      new SimpleField('STYLEREF 1 \\s'), 
      new TextRun({ text: '.', bold: style.bold }),
      new SimpleField('SEQ Figure \\* ARABIC'),
      new TextRun({ text: `: ${text}`, bold: style.bold }),
      new BookmarkEnd(bId),
    ],
    spacing: { before: 200, after: 200 },
    alignment: AlignmentType.CENTER,
  });
}

/**
 * Creates an academic table caption with automatic SEQ numbering
 */
export function createTableCaption(text: string, profile: StyleProfile, id: string = Math.random().toString(36).substr(2, 9)) {
  const bId = bookmarkIdCounter++;
  const style = profile.captions.table;
  return new Paragraph({
    children: [
      new BookmarkStart(`tab_${id}`, bId),
      new TextRun({ text: 'Table ', bold: style.bold }),
      new SimpleField('STYLEREF 1 \\s'),
      new TextRun({ text: '.', bold: style.bold }),
      new SimpleField('SEQ Table \\* ARABIC'),
      new TextRun({ text: `: ${text}`, bold: style.bold }),
      new BookmarkEnd(bId),
    ],
    spacing: { before: 200, after: 100 },
    alignment: style.placement === 'above' ? AlignmentType.LEFT : AlignmentType.CENTER,
  });
}

function processContentNode(node: any, profile: StyleProfile) {
  if (node.type === 'heading') {
    const level = node.attrs?.level || 1;
    const hRule = profile.headingRules[level] || profile.headingRules[3] || profile.headingRules[1];
    
    return new Paragraph({
      children: [
        new TextRun({
          text: hRule.uppercase ? (node.content?.[0]?.text || '').toUpperCase() : (node.content?.[0]?.text || ''),
          bold: hRule.bold,
          italics: hRule.italics,
          size: hRule.size,
          font: profile.font,
        })
      ],
      heading: level === 1 ? HeadingLevel.HEADING_1 : 
               level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
      pageBreakBefore: hRule.pageBreakBefore,
      alignment: hRule.alignment,
      numbering: level <= 2 ? { 
        reference: 'chapter-numbering', 
        level: level - 1 
      } : undefined,
      spacing: { before: 400, after: 200 },
    });
  }

  if (node.type === 'codeBlock') {
    const text = (node.content || []).map((c: any) => c.text || '').join('');
    return new Paragraph({
      children: [
        new TextRun({
          text,
          font: 'Courier New',
          size: 20,
        })
      ],
      spacing: { before: 200, after: 200 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6 },
        bottom: { style: BorderStyle.SINGLE, size: 6 },
        left: { style: BorderStyle.SINGLE, size: 6 },
        right: { style: BorderStyle.SINGLE, size: 6 },
      },
      shading: {
        fill: 'F4F4F5',
      }
    });
  }

  if (node.type === 'table') {
    const rows = (node.content || []).map((tr: any) => {
      const cells = (tr.content || []).map((td: any) => {
        const cellText = (td.content || [])
          .map((p: any) => (p.content || []).map((t: any) => t.text || '').join(''))
          .join('\n');
        
        return new TableCell({
          children: [
            new Paragraph({ 
              children: [new TextRun({ text: cellText, size: profile.fontSize - 4, font: profile.font })] 
            })
          ],
          width: { size: 100 / tr.content.length, type: WidthType.PERCENTAGE },
        });
      });
      return new TableRow({ children: cells });
    });

    const docxTable = new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6 },
        bottom: { style: BorderStyle.SINGLE, size: 6 },
        left: { style: BorderStyle.SINGLE, size: 6 },
        right: { style: BorderStyle.SINGLE, size: 6 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 6 },
        insideVertical: { style: BorderStyle.SINGLE, size: 6 },
      }
    });

    const caption = createTableCaption(node.attrs?.caption || "Data Table", profile);
    return profile.captions.table.placement === 'above' 
      ? [caption, docxTable] 
      : [docxTable, caption];
  }

  if (node.type === 'bulletList' || node.type === 'orderedList') {
    return (node.content || []).map((listItem: any) => {
      const text = (listItem.content?.[0]?.content || [])
        .map((inline: any) => inline.text || '')
        .join('');

      return new Paragraph({
        children: [new TextRun({ text, font: profile.font, size: profile.fontSize })],
        bullet: node.type === 'bulletList' ? { level: 0 } : undefined,
        numbering: node.type === 'orderedList' ? { reference: 'main-numbering', level: 0 } : undefined,
        spacing: { before: 100, after: 100 },
        indent: { left: 720, hanging: 360 },
      });
    });
  }

  if (node.type === 'image') {
    const caption = createFigureCaption(node.attrs?.title || node.attrs?.alt || 'Figure Caption', node.attrs?.id || Math.random().toString(36).substr(2, 9), profile);
    const placeholder = new Paragraph({
      text: `[Image: ${node.attrs?.title || node.attrs?.alt || 'Figure'}]`,
      alignment: AlignmentType.CENTER,
    });

    return profile.captions.figure.placement === 'above'
      ? [caption, placeholder]
      : [placeholder, caption];
  }

  if (node.type === 'paragraph') {
    const inlineChildren = (node.content || []).map((inlineNode: any) => {
      if (inlineNode.type === 'text') {
        return new TextRun({
          text: inlineNode.text,
          bold: inlineNode.marks?.some((m: any) => m.type === 'bold'),
          italics: inlineNode.marks?.some((m: any) => m.type === 'italic'),
          underline: inlineNode.marks?.some((m: any) => m.type === 'underline'),
          size: profile.fontSize,
          font: profile.font,
        });
      }
      if (inlineNode.type === 'citation') {
        return [
          new TextRun({ text: ' (', color: '4F46E5', bold: true, size: profile.fontSize }),
          new SimpleField(`CITATION ${inlineNode.attrs?.label || 'Ref'} \\l 1033`),
          new TextRun({ text: ')', color: '4F46E5', bold: true, size: profile.fontSize }),
        ];
      }
      return null;
    }).flat().filter(Boolean);

    return new Paragraph({
      children: inlineChildren as (TextRun | SimpleField)[],
      spacing: { line: profile.lineSpacing, after: 200 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: profile.paragraphIndent },
    });
  }

  return null;
}

export async function exportToDocx(content: any, sources: Source[] = [], title: string = 'Manuscript', profileId: string = 'apa') {
  if (!content || !content.content) return;

  const profile = STYLE_PROFILES[profileId] || STYLE_PROFILES.apa;
  bookmarkIdCounter = 0;
  const children: any[] = [];

  // 1. Title Page
  children.push(new Paragraph({
    text: title.toUpperCase(),
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { before: 2000, after: 400 },
  }));
  
  children.push(new Paragraph({
    text: `A Thesis Submitted in Fulfillment of the Requirements for ${profile.name}`,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));

  children.push(new Paragraph({
    text: 'Prepared by Thesis Architect',
    alignment: AlignmentType.CENTER,
    spacing: { after: 4000 },
  }));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 2. Table of Contents
  children.push(new Paragraph({
    text: 'Table of Contents',
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 400 },
  }));
  
  children.push(new TableOfContents("Table of Contents", {
    hyperlink: true,
    headingStyleRange: "1-3",
  }));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 3. List of Figures
  children.push(new Paragraph({
    text: 'List of Figures',
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 400 },
  }));
  children.push(new Paragraph({
    children: [new SimpleField('TOC \\c "Figure"')]
  }));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 4. List of Tables
  children.push(new Paragraph({
    text: 'List of Tables',
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 400 },
  }));
  children.push(new Paragraph({
    children: [new SimpleField('TOC \\c "Table"')]
  }));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 5. Main Body Content
  content.content.forEach((node: any) => {
    const result = processContentNode(node, profile);
    if (Array.isArray(result)) {
      children.push(...result);
    } else if (result) {
      children.push(result);
    }
  });

  // 6. Bibliography
  if (sources.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({
      text: 'References',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
    }));

    const sortedSources = [...sources].sort((a, b) => a.authors.localeCompare(b.authors));
    
    sortedSources.forEach(source => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: source.authors, bold: true, font: profile.font, size: profile.fontSize }),
          new TextRun({ text: ` (${source.year}). `, font: profile.font, size: profile.fontSize }),
          new TextRun({ text: source.title, italics: true, font: profile.font, size: profile.fontSize }),
          new TextRun({ text: `. ${source.journal || source.publisher || ''}.`, font: profile.font, size: profile.fontSize }),
        ],
        spacing: { after: 120 },
        indent: { left: 720, hanging: 720 },
      }));
    });
  }

  const doc = new Document({
    creator: 'Research Studio AI',
    title: title,
    description: `Generated Thesis Manuscript (${profile.name})`,
    numbering: {
      config: [
        {
          reference: 'main-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
        {
          reference: 'chapter-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: 'Chapter %1: ',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  spacing: { before: 400, after: 200 },
                },
              },
            },
            {
              level: 1,
              format: 'decimal',
              text: '%1.%2 ',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  spacing: { before: 300, after: 150 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/\s+/g, '_')}_${profile.id.toUpperCase()}.docx`);
}

export async function exportToMarkdown(content: any, sources: Source[] = [], title: string = 'Manuscript') {
  if (!content || !content.content) return;

  let markdown = `# ${title}\n\n`;

  content.content.forEach((node: any) => {
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const text = node.content?.[0]?.text || '';
      markdown += `${'#'.repeat(level)} ${text}\n\n`;
    } else if (node.type === 'paragraph') {
      const line = (node.content || []).map((inlineNode: any) => {
        if (inlineNode.type === 'text') {
          let text = inlineNode.text;
          if (inlineNode.marks) {
            inlineNode.marks.forEach((mark: any) => {
              if (mark.type === 'bold') text = `**${text}**`;
              if (mark.type === 'italic') text = `*${text}*`;
            });
          }
          return text;
        }
        if (inlineNode.type === 'citation') {
          return `**(${inlineNode.attrs?.label || 'Citation'})**`;
        }
        return '';
      }).join('');
      if (line) markdown += `${line}\n\n`;
    }
  });

  if (sources.length > 0) {
    markdown += `---\n\n# References\n\n`;
    const sortedSources = [...sources].sort((a, b) => a.authors.localeCompare(b.authors));
    sortedSources.forEach(source => {
      markdown += `**${source.authors}** (${source.year}). *${source.title}*. ${source.journal || source.publisher || ''}.\n\n`;
    });
  }

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${title.replace(/\s+/g, '_')}.md`);
}

export async function exportToPlainText(content: any, sources: Source[] = [], title: string = 'Manuscript') {
  if (!content || !content.content) return;

  let text = `${title.toUpperCase()}\n${'='.repeat(title.length)}\n\n`;

  content.content.forEach((node: any) => {
    if (node.type === 'heading') {
      const contentText = (node.content || []).map((c: any) => c.text).join('') || '';
      text += `${contentText.toUpperCase()}\n${'-'.repeat(contentText.length)}\n\n`;
    } else if (node.type === 'paragraph') {
      const line = (node.content || []).map((inlineNode: any) => {
        if (inlineNode.type === 'text') return inlineNode.text;
        if (inlineNode.type === 'citation') return `(${inlineNode.attrs?.label || 'Citation'})`;
        return '';
      }).join('');
      if (line) text += `${line}\n\n`;
    }
  });

  if (sources.length > 0) {
    text += `\nREFERENCES\n${'='.repeat(10)}\n\n`;
    const sortedSources = [...sources].sort((a, b) => a.authors.localeCompare(b.authors));
    sortedSources.forEach(source => {
      text += `${source.authors} (${source.year}). ${source.title}. ${source.journal || source.publisher || ''}.\n\n`;
    });
  }

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${title.replace(/\s+/g, '_')}.txt`);
}
