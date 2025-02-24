import React from 'react';

export function toSentenceCase(str: string): string {
  if (!str) return '';
  
  if (str.includes('-')) {
    return str
      .split('-')
      .map(toSentenceCase)
      .join('-');
  }
  
  if (str.includes(' ')) {
    return str
      .split(' ')
      .map(toSentenceCase)
      .join(' ');
  }

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function highlightEntitiesInText(text: string, entities: { name?: string }[] = []): React.ReactNode {
  if (!text || entities.length === 0) return text;

  const allEntityNames = entities
    .map(e => e.name?.toLowerCase())
    .filter(Boolean) as string[];

  if (allEntityNames.length === 0) return text;

  const entityRegex = new RegExp(`\\b(${allEntityNames.join('|')})\\b`, 'gi');

  const parts = text.split(entityRegex).map((part: string, i: number) => {
    if (allEntityNames.includes(part.toLowerCase())) {
      return React.createElement('span', {
        key: i,
        className: "font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-100",
        title: "Entidad clínica identificada"
      }, toSentenceCase(part));
    }
    return part;
  });

  return React.createElement(React.Fragment, null, ...parts);
}