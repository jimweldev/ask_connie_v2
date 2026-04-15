/**
 * Converts a string to different naming conventions
 * @param str - The input string to convert
 * @param convention - The target naming convention
 * @returns The converted string
 */
export default function convertNaming(
  str: string | null | undefined,
  convention: NamingConvention,
): string {
  if (!str || str.trim() === '') return '';

  const input = str.trim();
  // Normalize everything to singular first to prevent double-pluralization
  const singularBase = toSingular(input);

  switch (convention) {
    case 'PascalSingular':
      return toPascalCase(singularBase);

    case 'PascalPlural':
      return toPascalCase(toPlural(singularBase));

    case 'CamelSingular':
      return toCamelCase(singularBase);

    case 'CamelPlural':
      return toCamelCase(toPlural(singularBase));

    case 'KebabSingular':
      return toKebabCase(singularBase);

    case 'KebabPlural':
      return toKebabCase(toPlural(singularBase));

    case 'Readable':
    case 'ReadableSingular':
      return toReadableCase(singularBase);

    case 'ReadablePlural':
      return toReadableCase(toPlural(singularBase));

    default:
      return input;
  }
}

// Type definition for naming conventions
export type NamingConvention =
  | 'PascalSingular'
  | 'PascalPlural'
  | 'CamelSingular'
  | 'CamelPlural'
  | 'KebabSingular'
  | 'KebabPlural'
  | 'Readable'
  | 'ReadableSingular'
  | 'ReadablePlural';

// Helper functions
const toSingular = (word: string): string => {
  // If it's a multi-word string (system_settings), only process the last part
  const parts = word.split(/([_\s-]+)/);
  const lastWord = parts[parts.length - 1];
  const prefix = parts.slice(0, -1).join('');

  const lower = lastWord.toLowerCase();

  // Irregular plurals
  const irregular: Record<string, string> = {
    children: 'child',
    people: 'person',
    men: 'man',
    women: 'woman',
    geese: 'goose',
    mice: 'mouse',
    feet: 'foot',
    teeth: 'tooth',
    leaves: 'leaf',
    wolves: 'wolf',
    lives: 'life',
    knives: 'knife',
    shelves: 'shelf',
    tomatoes: 'tomato',
    potatoes: 'potato',
    crises: 'crisis',
    matrices: 'matrix',
    vertices: 'vertex',
    indices: 'index',
    analyses: 'analysis',
    ellipses: 'ellipsis',
    moose: 'moose',
    deer: 'deer',
    fish: 'fish',
    species: 'species',
  };

  if (irregular[lower]) return prefix + irregular[lower];

  // Logic for 'is' vs 'es' (plural 'analyses' -> singular 'analysis')
  if (lower.endsWith('ses') && lower.length > 3)
    return prefix + lastWord.slice(0, -2) + 'is';

  // Regular plural patterns
  if (lower.endsWith('ies') && lower.length > 3)
    return prefix + lastWord.slice(0, -3) + 'y';

  // Standard 's' removal - check that it's not 'ss' (like 'address')
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 1) {
    return prefix + lastWord.slice(0, -1);
  }

  return word;
};

const toPlural = (word: string): string => {
  const parts = word.split(/([_\s-]+)/);
  const lastWord = parts[parts.length - 1];
  const prefix = parts.slice(0, -1).join('');

  const lower = lastWord.toLowerCase();

  // Already plural check
  if (lower.endsWith('settings')) return word;

  // Irregular singulars
  const irregular: Record<string, string> = {
    child: 'children',
    person: 'people',
    man: 'men',
    woman: 'women',
    goose: 'geese',
    mouse: 'mice',
    foot: 'feet',
    tooth: 'teeth',
    leaf: 'leaves',
    wolf: 'wolves',
    life: 'lives',
    knife: 'knives',
    shelf: 'shelves',
    tomato: 'tomatoes',
    potato: 'potatoes',
    crisis: 'crises',
    matrix: 'matrices',
    vertex: 'vertices',
    index: 'indices',
    analysis: 'analyses',
    ellipsis: 'ellipses',
  };

  if (irregular[lower]) return prefix + irregular[lower];

  // FIX: Added '$' to ensure we only match the end of the word
  // This prevents 'system' from triggering the 'y' -> 'ies' rule
  if (/[b-df-hj-np-tv-z]y$/i.test(lastWord)) {
    return prefix + lastWord.slice(0, -1) + 'ies';
  }

  // Words ending in 's', 'x', 'z', 'ch', or 'sh'
  if (
    /[sxz]$/i.test(lastWord) ||
    /ch$/i.test(lastWord) ||
    /sh$/i.test(lastWord)
  ) {
    if (!lower.endsWith('es')) return prefix + lastWord + 'es';
    return word;
  }

  return prefix + lastWord + 's';
};

const toPascalCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

const toCamelCase = (str: string): string => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
};

const toReadableCase = (str: string): string => {
  return str
    .replace(/[_\s-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
};
