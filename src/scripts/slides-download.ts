export function setupSlidesDownloadDialog() {
  const dialog = document.querySelector<HTMLDialogElement>("#slides-download-dialog");
  if (!dialog || typeof dialog.showModal !== "function" || dialog.dataset.initialized) return;
  dialog.dataset.initialized = "true";

  document.querySelectorAll<HTMLAnchorElement>("a[data-slides-download]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (!dialog.open) dialog.showModal();
    });
  });

  dialog.querySelector("[data-slides-close]")?.addEventListener("click", () => dialog.close());
  dialog.querySelectorAll("[data-slides-source]").forEach((source) => {
    source.addEventListener("click", () => dialog.close());
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}
