export interface BoardItem {
  id: string;
  category: string;
  name: string;
  image: string;
}

// Move before another card, or append to the selected tier. Work on a copy for undo.
export function moveItem(items: BoardItem[], id: string, category: string, beforeId?: string) {
  const source = items.find((item) => item.id === id);
  if (!source || id === beforeId) return items;
  const rest = items.filter((item) => item.id !== id);
  const destination = rest.findIndex((item) => item.id === beforeId && item.category === category);
  rest.splice(destination < 0 ? rest.length : destination, 0, { ...source, category });
  return rest;
}

export function validDraft(value: unknown, categories: string[]): value is BoardItem[] {
  if (!Array.isArray(value) || value.length > 300) return false;
  const ids = new Set<string>();
  return value.every((item) => {
    if (!item || typeof item.id !== 'string' || ids.has(item.id) ||
      !categories.includes(item.category) || typeof item.name !== 'string' ||
      !item.name.trim() || typeof item.image !== 'string') return false;
    ids.add(item.id);
    return item.image === '' || /^\/images\/sponsors\/[^/]+$/.test(item.image) ||
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(item.image);
  });
}
