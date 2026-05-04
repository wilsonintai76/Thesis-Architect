import { AlignmentType } from 'docx';

export type CitationStyle = 'author-date' | 'numeric' | 'footnote';
export type CaptionPlacement = 'above' | 'below';
export type AlignmentValue = typeof AlignmentType[keyof typeof AlignmentType];

export interface StyleProfile {
  name: string;
  id: string;
  description: string;
  font: string;
  fontSize: number;
  lineSpacing: number; // in twentieths of a point (360 = 1.5, 480 = 2.0)
  paragraphIndent: number;
  headingRules: {
    [key: number]: {
      size: number;
      bold: boolean;
      italics: boolean;
      uppercase: boolean;
      pageBreakBefore: boolean;
      alignment: AlignmentValue;
    };
  };
  captions: {
    figure: { placement: CaptionPlacement; bold: boolean };
    table: { placement: CaptionPlacement; bold: boolean };
  };
  citations: CitationStyle;
}

export const STYLE_PROFILES: Record<string, StyleProfile> = {
  apa: {
    name: 'APA 7th Edition',
    id: 'apa',
    description: 'American Psychological Association standard for social sciences.',
    font: 'Times New Roman',
    fontSize: 24, // 12pt
    lineSpacing: 480, // Double spaced
    paragraphIndent: 720, // 0.5 inch
    headingRules: {
      1: { size: 24, bold: true, italics: false, uppercase: false, pageBreakBefore: true, alignment: AlignmentType.CENTER },
      2: { size: 24, bold: true, italics: false, uppercase: false, pageBreakBefore: false, alignment: AlignmentType.LEFT },
      3: { size: 24, bold: true, italics: true, uppercase: false, pageBreakBefore: false, alignment: AlignmentType.LEFT },
    },
    captions: {
      figure: { placement: 'below', bold: true },
      table: { placement: 'above', bold: true },
    },
    citations: 'author-date',
  },
  mla: {
    name: 'MLA 9th Edition',
    id: 'mla',
    description: 'Modern Language Association style for humanities and literature.',
    font: 'Times New Roman',
    fontSize: 24, // 12pt
    lineSpacing: 480, // Double spaced
    paragraphIndent: 720, // 0.5 inch
    headingRules: {
      1: { size: 24, bold: false, italics: false, uppercase: false, pageBreakBefore: true, alignment: AlignmentType.CENTER },
      2: { size: 24, bold: false, italics: false, uppercase: false, pageBreakBefore: false, alignment: AlignmentType.LEFT },
      3: { size: 24, bold: false, italics: true, uppercase: false, pageBreakBefore: false, alignment: AlignmentType.LEFT },
    },
    captions: {
      figure: { placement: 'below', bold: false },
      table: { placement: 'above', bold: false },
    },
    citations: 'author-date',
  },
  chicago: {
    name: 'Chicago (Notes & Bio)',
    id: 'chicago',
    description: 'Chicago Manual of Style for history and full citations.',
    font: 'Times New Roman',
    fontSize: 24, // 12pt
    lineSpacing: 240, // Single/Double spaced
    paragraphIndent: 720, 
    headingRules: {
      1: { size: 32, bold: true, italics: false, uppercase: false, pageBreakBefore: true, alignment: AlignmentType.CENTER },
      2: { size: 28, bold: true, italics: false, uppercase: false, pageBreakBefore: false, alignment: AlignmentType.LEFT },
      3: { size: 24, bold: true, italics: true, uppercase: false, pageBreakBefore: false, alignment: AlignmentType.LEFT },
    },
    captions: {
      figure: { placement: 'below', bold: false },
      table: { placement: 'above', bold: false },
    },
    citations: 'footnote',
  },
  ieee: {
    name: 'IEEE Standard',
    id: 'ieee',
    description: 'Institute of Electrical and Electronics Engineers style for technical fields.',
    font: 'Arial',
    fontSize: 20, // 10pt
    lineSpacing: 240, // Single spaced
    paragraphIndent: 360, // 0.25 inch
    headingRules: {
      1: { size: 48, bold: true, italics: false, uppercase: true, pageBreakBefore: true, alignment: AlignmentType.CENTER },
      2: { size: 24, bold: true, italics: true, uppercase: false, pageBreakBefore: false, alignment: AlignmentType.LEFT },
      3: { size: 20, bold: false, italics: true, uppercase: false, pageBreakBefore: false, alignment: AlignmentType.LEFT },
    },
    captions: {
      figure: { placement: 'below', bold: false },
      table: { placement: 'above', bold: false },
    },
    citations: 'numeric',
  }
};
