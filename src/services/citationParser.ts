import { Source, SourceType } from '../types';

export function parseRIS(risContent: string): Partial<Source>[] {
  const entries: Partial<Source>[] = [];
  const lines = risContent.split(/\r?\n/);
  let currentEntry: Record<string, string> = {};

  for (let line of lines) {
    line = line.trim();
    if (line === 'ER  -') {
      if (Object.keys(currentEntry).length > 0) {
        entries.push(mapRISToSource(currentEntry));
        currentEntry = {};
      }
      continue;
    }

    const match = line.match(/^([A-Z0-9]{2})\s+-\s+(.*)$/);
    if (match) {
      const tag = match[1];
      const value = match[2];
      
      if (tag === 'AU') {
        currentEntry.AU = currentEntry.AU ? `${currentEntry.AU}, ${value}` : value;
      } else {
        currentEntry[tag] = value;
      }
    }
  }

  // Handle case where ER - might be missing for the last entry
  if (Object.keys(currentEntry).length > 0) {
    entries.push(mapRISToSource(currentEntry));
  }

  return entries;
}

function mapRISToSource(ris: Record<string, string>): Partial<Source> {
  let type: SourceType = 'article';
  const ty = ris.TY || '';
  if (ty === 'BOOK') type = 'book';
  else if (ty === 'JOUR') type = 'journal';
  else if (ty === 'ELEC') type = 'website';

  return {
    type,
    title: ris.TI || ris.T1 || 'Untitled',
    authors: ris.AU || 'Unknown Author',
    year: ris.PY || ris.Y1 || ris.Y2 || 'n.d.',
    publisher: ris.PB,
    journal: ris.JF || ris.JO || ris.T2,
    doi: ris.DO,
    url: ris.UR || ris.L1,
  };
}

export function parseBibTeX(bibContent: string): Partial<Source>[] {
  const entries: Partial<Source>[] = [];
  // Basic regex for BibTeX entries
  // @type{key, ...fields}
  const entryRegex = /@(\w+)\s*\{\s*([^,]+),([\s\S]*?)\n\}/g;
  let match;

  while ((match = entryRegex.exec(bibContent)) !== null) {
    const entryType = match[1].toLowerCase();
    const fieldsText = match[3];
    const fields: Record<string, string> = {};

    // Simple field parser: field = {value} or field = "value"
    const fieldRegex = /(\w+)\s*=\s*(?:\{([\s\S]*?)\}|"([\s\S]*?)")|(\w+)\s*=\s*(\d+)/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(fieldsText)) !== null) {
      const key = fieldMatch[1] || fieldMatch[4];
      const value = fieldMatch[2] || fieldMatch[3] || fieldMatch[5];
      fields[key.toLowerCase()] = value;
    }

    entries.push(mapBibTexToSource(entryType, fields));
  }

  return entries;
}

function mapBibTexToSource(entryType: string, fields: Record<string, string>): Partial<Source> {
  let type: SourceType = 'article';
  if (entryType === 'book') type = 'book';
  else if (entryType === 'article') type = 'journal';
  else if (entryType === 'online' || entryType === 'misc') type = 'website';

  return {
    type,
    title: fields.title || 'Untitled',
    authors: fields.author || 'Unknown Author',
    year: fields.year || 'n.d.',
    publisher: fields.publisher || fields.school || fields.institution,
    journal: fields.journal || fields.series,
    doi: fields.doi,
    url: fields.url || fields.howpublished,
  };
}
