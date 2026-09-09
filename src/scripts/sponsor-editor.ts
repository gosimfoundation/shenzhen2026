import { moveItem, validDraft, type BoardItem } from '../utils/sponsor-board';

type Category = { id: string; name: string };
const STORAGE_KEY = 'board-v1';

export async function initSponsorEditor() {
  const root = document.querySelector<HTMLElement>('#sponsor-editor');
  if (!root) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const initial: BoardItem[] = JSON.parse(root.dataset.initial!);
  const categories: Category[] = JSON.parse(root.dataset.categories!);
  const board = get<HTMLDivElement>('board');
  const dialog = get<HTMLDialogElement>('item-dialog');
  const form = get<HTMLFormElement>('item-form');
  const nameInput = get<HTMLInputElement>('item-name');
  const categoryInput = get<HTMLSelectElement>('item-category');
  const fileInput = get<HTMLInputElement>('item-file');
  const filePreview = get<HTMLImageElement>('file-preview');
  const clearImage = get<HTMLButtonElement>('clear-image');
  const error = get<HTMLParagraphElement>('form-error');
  const status = get<HTMLParagraphElement>('save-status');
  const undo = get<HTMLButtonElement>('undo');
  const preview = get<HTMLButtonElement>('preview');
  const showEmpty = get<HTMLInputElement>('show-empty');
  const saveButton = get<HTMLButtonElement>('save-item');
  let items = initial;
  let history: BoardItem[][] = [];
  let db: IDBDatabase | undefined;
  let editingId: string | undefined;
  let draftImage = '';
  let readingImage = false;
  let imageRequest = 0;
  let draggedId: string | undefined;
  let previewMode = false;
  let revision = 0;
  let opener: HTMLElement | null = null;

  for (const category of categories) {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categoryInput.append(option);
  }

  try {
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('gosim-sponsor-editor', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('drafts');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('数据库被其他标签页占用'));
    });
    const saved = await new Promise<unknown>((resolve, reject) => {
      const request = db!.transaction('drafts').objectStore('drafts').get(STORAGE_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (saved !== undefined && !validDraft(saved, categories.map(({ id }) => id))) {
      status.textContent = '旧草稿无法读取，已显示正式名单；下次编辑会保存新草稿。';
    } else {
      if (saved !== undefined) items = saved;
      status.textContent = saved !== undefined ? '已恢复本机草稿' : '已载入正式名单，编辑后自动保存到本机';
    }
  } catch {
    db = undefined;
    status.textContent = '浏览器无法保存草稿，本次仍可编辑；请在关闭页面前截图。';
  }

  function persist() {
    const currentRevision = ++revision;
    if (!db) {
      status.textContent = '尚未保存：浏览器存储不可用，请在关闭页面前截图。';
      return;
    }
    status.textContent = '正在保存…';
    try {
      const transaction = db.transaction('drafts', 'readwrite');
      transaction.objectStore('drafts').put(items, STORAGE_KEY);
      transaction.oncomplete = () => {
        if (revision === currentRevision) status.textContent = '已自动保存到本机 · 不影响正式页面';
      };
      transaction.onabort = transaction.onerror = () => {
        if (revision === currentRevision) status.textContent = '保存失败，可能是存储空间不足。请先截图，勿关闭页面。';
      };
    } catch {
      status.textContent = '保存失败，请在关闭页面前截图。';
    }
  }

  function commit(next: BoardItem[]) {
    history.push(items);
    if (history.length > 30) history.shift();
    items = next;
    render();
    persist();
  }

  function render() {
    board.replaceChildren();
    undo.disabled = history.length === 0;
    for (const category of categories) {
      const members = items.filter((item) => item.category === category.id);
      const usuallyVisible = initial.some((item) => item.category === category.id);
      if (!members.length && (previewMode || (!usuallyVisible && !showEmpty.checked))) continue;
      const tier = document.createElement('section');
      tier.className = 'tier';
      tier.dataset.category = category.id;
      const label = document.createElement('div');
      label.className = 'tier-label';
      const heading = document.createElement('h2');
      heading.textContent = category.name;
      label.append(heading);
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'add';
      add.textContent = '+';
      add.setAttribute('aria-label', `添加${category.name}`);
      add.onclick = () => openDialog(category.id);
      label.append(add);
      const list = document.createElement('div');
      list.className = 'tier-items';
      list.dataset.category = category.id;
      for (const item of members) {
        const card = document.createElement('div');
        card.className = 'sponsor-item';
        card.dataset.id = item.id;
        card.draggable = !previewMode;
        if (!previewMode) {
          card.tabIndex = 0;
          card.setAttribute('role', 'button');
          card.setAttribute('aria-label', `编辑 ${item.name}，${category.name}`);
          card.title = '拖动调整位置；点击编辑；Alt + 左右方向键调整顺序';
        }
        const visual = document.createElement('div');
        visual.className = 'logo-card';
        if (item.image) {
          const image = document.createElement('img');
          image.src = item.image;
          image.alt = item.name;
          image.draggable = false;
          image.onerror = () => { visual.replaceChildren(document.createTextNode(item.name)); };
          visual.append(image);
        } else {
          visual.classList.add('text-card');
          visual.textContent = item.name;
        }
        card.append(visual);
        if (item.image) {
          const caption = document.createElement('p');
          caption.className = 'item-name';
          caption.textContent = item.name;
          card.append(caption);
        }
        card.onclick = () => { if (!previewMode) openDialog(item.category, item); };
        card.onkeydown = (event) => {
          if (previewMode) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); openDialog(item.category, item);
          } else if (event.altKey && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            reorder(item.id, event.key === 'ArrowLeft' ? -1 : 1);
            board.querySelector<HTMLElement>(`[data-id="${item.id}"]`)?.focus();
          }
        };
        card.ondragstart = (event) => {
          if (previewMode || !event.dataTransfer) return;
          draggedId = item.id;
          event.dataTransfer.setData('text/plain', item.id);
          event.dataTransfer.effectAllowed = 'move';
          card.classList.add('dragging');
        };
        card.ondragend = () => { draggedId = undefined; card.classList.remove('dragging'); clearDrag(); };
        list.append(card);
      }
      if (!members.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-tier';
        empty.textContent = '将 logo 拖到这里，或点击左侧 ＋';
        list.append(empty);
      }
      list.ondragover = (event) => {
        if (previewMode || !draggedId) return;
        event.preventDefault();
        event.dataTransfer!.dropEffect = 'move';
        clearDrag();
        list.classList.add('drop-active');
        const target = (event.target as Element).closest<HTMLElement>('.sponsor-item');
        if (target && target.dataset.id !== draggedId) {
          const rect = target.getBoundingClientRect();
          target.classList.add(event.clientX < rect.left + rect.width / 2 ? 'drop-before' : 'drop-after');
        }
      };
      list.ondragleave = (event) => {
        if (!(event.relatedTarget instanceof Node) || !list.contains(event.relatedTarget)) clearDrag();
      };
      list.ondrop = (event) => {
        if (previewMode || !draggedId) return;
        event.preventDefault();
        const target = (event.target as Element).closest<HTMLElement>('.sponsor-item');
        let beforeId: string | undefined;
        if (target) {
          const rect = target.getBoundingClientRect();
          const targetId = target.dataset.id!;
          if (targetId === draggedId) { clearDrag(); return; }
          const rest = members.filter((item) => item.id !== draggedId);
          const index = rest.findIndex((item) => item.id === targetId);
          beforeId = event.clientX < rect.left + rect.width / 2 ? targetId : rest[index + 1]?.id;
        }
        const next = moveItem(items, draggedId, category.id, beforeId);
        draggedId = undefined;
        clearDrag();
        commit(next);
      };
      tier.append(label, list);
      board.append(tier);
    }
  }

  function clearDrag() {
    board.querySelectorAll('.drop-active, .drop-before, .drop-after').forEach((element) =>
      element.classList.remove('drop-active', 'drop-before', 'drop-after'));
  }

  function reorder(id: string, offset: number) {
    const item = items.find((entry) => entry.id === id)!;
    const peers = items.filter((entry) => entry.category === item.category);
    const index = peers.findIndex((entry) => entry.id === id);
    if (index + offset < 0 || index + offset >= peers.length) return;
    commit(moveItem(items, id, item.category, peers[index + (offset < 0 ? -1 : 2)]?.id));
  }

  function updateImage() {
    filePreview.hidden = !draftImage;
    clearImage.hidden = !draftImage;
    if (draftImage) filePreview.src = draftImage;
    else filePreview.removeAttribute('src');
  }

  function openDialog(category: string, item?: BoardItem) {
    opener = document.activeElement as HTMLElement;
    imageRequest++;
    form.reset();
    editingId = item?.id;
    draftImage = item?.image || '';
    readingImage = false;
    saveButton.disabled = false;
    nameInput.value = item?.name || '';
    categoryInput.value = category;
    get('dialog-title').textContent = item ? '编辑赞助商' : '添加赞助商';
    saveButton.textContent = item ? '保存' : '添加';
    get('delete-item').hidden = !item;
    get('reorder-actions').hidden = !item;
    error.textContent = '';
    updateImage();
    dialog.showModal();
    nameInput.focus();
  }

  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    const request = ++imageRequest;
    if (!file) return;
    error.textContent = '';
    readingImage = true;
    saveButton.disabled = true;
    try {
      const image = await readLogo(file);
      if (request !== imageRequest) return;
      draftImage = image;
      if (!nameInput.value.trim()) nameInput.value = file.name.replace(/\.[^.]+$/, '').slice(0, 160);
      updateImage();
    } catch (cause) {
      if (request === imageRequest) error.textContent = (cause as Error).message;
    } finally {
      if (request === imageRequest) { readingImage = false; saveButton.disabled = false; }
    }
  };
  clearImage.onclick = () => { imageRequest++; readingImage = false; saveButton.disabled = false; draftImage = ''; fileInput.value = ''; updateImage(); };
  get('cancel').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    imageRequest++;
    if (opener?.isConnected) opener.focus();
    else board.querySelector<HTMLButtonElement>(`.tier[data-category="${categoryInput.value}"] .add`)?.focus();
  });
  form.onsubmit = (event) => {
    event.preventDefault();
    if (readingImage) return;
    const name = nameInput.value.trim();
    if (!name) { error.textContent = '请输入名称，或上传一张 logo。'; nameInput.focus(); return; }
    if (!editingId && items.length >= 300) { error.textContent = '草稿最多可添加 300 家单位，请先删除不需要的卡片。'; return; }
    const item = { id: editingId || crypto.randomUUID(), name, category: categoryInput.value, image: draftImage };
    commit(editingId ? items.map((entry) => entry.id === editingId ? item : entry) : [...items, item]);
    dialog.close();
  };
  get('delete-item').onclick = () => { commit(items.filter((item) => item.id !== editingId)); dialog.close(); };
  get('move-earlier').onclick = () => { if (editingId) reorder(editingId, -1); };
  get('move-later').onclick = () => { if (editingId) reorder(editingId, 1); };
  undo.onclick = () => { if (history.length) { items = history.pop()!; render(); persist(); } };
  get<HTMLButtonElement>('reset').disabled = false;
  get('reset').onclick = () => commit(initial);
  preview.disabled = false;
  preview.onclick = () => {
    previewMode = !previewMode;
    document.body.classList.toggle('preview-mode', previewMode);
    preview.textContent = previewMode ? '返回编辑' : '截图预览';
    preview.setAttribute('aria-pressed', String(previewMode));
    render();
  };
  showEmpty.onchange = render;
  render();
}

async function readLogo(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(file.type)) throw new Error('请上传 PNG、JPG、WebP、GIF 或 SVG 图片。');
  if (file.size > 10 * 1024 * 1024) throw new Error('图片超过 10 MB，请缩小后再上传。');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error();
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error();
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } catch {
    throw new Error('无法读取这张图片，请尝试导出为 PNG 或 JPG 后上传。');
  } finally { URL.revokeObjectURL(url); }
}
