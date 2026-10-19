export function setupCoverFlows(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>("[data-coverflow]").forEach(root => {
    if (root.dataset.coverflowInitialized === "true") return;
    root.dataset.coverflowInitialized = "true";
    const slides = [...root.querySelectorAll<HTMLButtonElement>("[data-coverflow-slide]")];
    const dots = [...root.querySelectorAll<HTMLButtonElement>("[data-coverflow-dot]")];
    if (!slides.length) return;
    const stage = root.querySelector<HTMLElement>("[data-coverflow-stage]")!;
    const dialog = root.querySelector<HTMLDialogElement>("[data-coverflow-dialog]")!;
    const fullImage = root.querySelector<HTMLImageElement>("[data-coverflow-full-image]")!;
    const autoplayButton = root.querySelector<HTMLButtonElement>("[data-coverflow-autoplay]")!;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active = 0;
    let pausedByUser = reducedMotion.matches;
    let hovered = false;
    let focused = root.contains(document.activeElement);
    let inView = typeof IntersectionObserver === "undefined";
    let timer: ReturnType<typeof window.setTimeout> | undefined;
    let pointer: { id: number; x: number; y: number } | null = null;

    const update = (index: number) => {
      active = ((index % slides.length) + slides.length) % slides.length;
      root.dataset.activePhoto = String(active);
      slides.forEach((slide, index) => {
        let offset = (index - active + slides.length) % slides.length;
        if (offset > slides.length / 2) offset -= slides.length;
        const distance = Math.abs(offset);
        slide.style.setProperty("--offset", String(offset));
        slide.style.setProperty("--distance", String(distance));
        slide.style.setProperty("--angle", `${offset === 0 ? 0 : offset < 0 ? 46 : -46}deg`);
        slide.style.setProperty("--slide-opacity", String(distance > 2 ? 0 : distance === 0 ? 1 : distance === 1 ? 0.8 : 0.48));
        slide.style.setProperty("--slide-depth", String(10 - distance));
        slide.classList.toggle("is-active", index === active);
        slide.tabIndex = index === active ? 0 : -1;
        slide.setAttribute("aria-label", `${index === active ? slide.dataset.openLabel : slide.dataset.selectLabel}: ${slide.dataset.caption}`);
        if (index === active) slide.setAttribute("aria-current", "true");
        else slide.removeAttribute("aria-current");
        if (distance > 2) slide.setAttribute("aria-hidden", "true");
        else slide.removeAttribute("aria-hidden");
      });
      dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === active);
        dot.setAttribute("aria-pressed", String(index === active));
      });
      if (dialog.open) updateFullImage();
      syncAutoplay();
    };

    const updateFullImage = () => {
      fullImage.src = slides[active].dataset.fullSrc || "";
      fullImage.alt = slides[active].dataset.photoAlt || "";
    };
    const stopAutoplay = () => {
      window.clearTimeout(timer);
      timer = undefined;
    };
    const canAutoplay = () => root.isConnected && slides.length > 1 && inView && !pausedByUser && !hovered && !focused && !document.hidden && !dialog.open && !pointer;
    const syncAutoplay = () => {
      stopAutoplay();
      const playing = canAutoplay();
      root.dataset.autoplayState = playing ? "playing" : "paused";
      autoplayButton.dataset.paused = String(pausedByUser);
      autoplayButton.setAttribute("aria-pressed", String(!pausedByUser));
      autoplayButton.setAttribute("aria-label", (pausedByUser ? autoplayButton.dataset.playLabel : autoplayButton.dataset.pauseLabel) || "");
      if (playing) timer = window.setTimeout(() => {
        if (canAutoplay()) update(active + 1);
        else syncAutoplay();
      }, 4000);
    };
    autoplayButton.addEventListener("click", () => {
      pausedByUser = !pausedByUser;
      syncAutoplay();
    });
    root.addEventListener("pointerenter", event => {
      if (event.pointerType !== "mouse") return;
      hovered = true;
      syncAutoplay();
    });
    root.addEventListener("pointerleave", event => {
      if (event.pointerType !== "mouse") return;
      hovered = false;
      syncAutoplay();
    });
    root.addEventListener("focusin", () => { focused = true; syncAutoplay(); });
    root.addEventListener("focusout", event => {
      if (root.contains(event.relatedTarget as Node | null)) return;
      focused = false;
      syncAutoplay();
    });
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) pausedByUser = true;
      syncAutoplay();
    };
    reducedMotion.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", syncAutoplay);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.2);
      syncAutoplay();
    }, { threshold: 0.2 });
    root.querySelector("[data-coverflow-prev]")?.addEventListener("click", () => update(active - 1));
    root.querySelector("[data-coverflow-next]")?.addEventListener("click", () => update(active + 1));
    dots.forEach((dot, index) => dot.addEventListener("click", () => update(index)));

    let suppressClickUntil = 0;
    slides.forEach((slide, index) => slide.addEventListener("click", () => {
      if (performance.now() < suppressClickUntil) return;
      if (index !== active) update(index);
      else {
        updateFullImage();
        dialog.showModal();
        syncAutoplay();
      }
    }));
    root.addEventListener("keydown", event => {
      if (dialog.open) return;
      const index = event.key === "ArrowLeft" ? active - 1 : event.key === "ArrowRight" ? active + 1 : event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1 : null;
      if (index === null) return;
      event.preventDefault();
      update(index);
      slides[active].focus({ preventScroll: true });
    });

    stage.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      syncAutoplay();
    });
    stage.addEventListener("pointercancel", () => { pointer = null; syncAutoplay(); });
    stage.addEventListener("pointerup", event => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      pointer = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) {
        syncAutoplay();
        return;
      }
      suppressClickUntil = performance.now() + 350;
      update(active + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener("dragstart", event => event.preventDefault());

    root.querySelector("[data-coverflow-close]")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", syncAutoplay);
    root.querySelector("[data-coverflow-lightbox-prev]")?.addEventListener("click", () => update(active - 1));
    root.querySelector("[data-coverflow-lightbox-next]")?.addEventListener("click", () => update(active + 1));
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      update(active + (event.key === "ArrowLeft" ? -1 : 1));
    });
    update(0);
    observer?.observe(root);
    document.addEventListener("astro:before-swap", () => {
      stopAutoplay();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", syncAutoplay);
      reducedMotion.removeEventListener("change", onMotionChange);
    }, { once: true });
  });
}
