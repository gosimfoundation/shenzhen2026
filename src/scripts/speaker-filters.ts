const CONTROL_SELECTOR = "[data-speaker-filter-control]";
const CARD_SELECTOR = "[data-speaker-filter-card]";

export function setupSpeakerFilters() {
  const stateHost = document.querySelector<HTMLElement>(
    "[data-speaker-filter-state]",
  );
  if (!stateHost || stateHost.dataset.speakerFilterInitialized === "true") {
    return;
  }

  stateHost.dataset.speakerFilterInitialized = "true";

  const controls = Array.from(
    document.querySelectorAll<HTMLButtonElement>(CONTROL_SELECTOR),
  );
  const cards = Array.from(
    stateHost.querySelectorAll<HTMLElement>(CARD_SELECTOR),
  );
  const summaries = Array.from(
    document.querySelectorAll<HTMLOutputElement>("[data-speaker-filter-summary]"),
  );
  const emptyState = stateHost.querySelector<HTMLElement>(
    "[data-speaker-filter-empty]",
  );
  const activeCategories = new Set<string>();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const render = (animate = true) => {
    const previousRects = new Map<HTMLElement, DOMRect>();
    if (animate && !reducedMotion) {
      for (const card of cards) {
        if (!card.hidden) previousRects.set(card, card.getBoundingClientRect());
      }
    }

    let visibleCount = 0;

    for (const card of cards) {
      const categories = (card.dataset.filterCategory || "")
        .split(/\s+/)
        .filter(Boolean);
      const isVisible =
        activeCategories.size === 0 ||
        categories.some((category) => activeCategories.has(category));

      card.hidden = !isVisible;
      card.dataset.filterStatus = isVisible ? "active" : "not-active";
      if (isVisible) visibleCount += 1;
    }

    for (const control of controls) {
      const category = control.dataset.filterCategory || "";
      const isActive =
        category === "all"
          ? activeCategories.size === 0
          : activeCategories.has(category);

      control.dataset.filterStatus = isActive ? "active" : "not-active";
      control.setAttribute("aria-pressed", String(isActive));
    }

    const allSummary = stateHost.dataset.summaryAll || "";
    const selectedSummary = stateHost.dataset.summarySelected || "";
    const summary =
      activeCategories.size === 0
        ? allSummary.replace("{visible}", String(visibleCount))
        : selectedSummary
            .replace("{selected}", String(activeCategories.size))
            .replace("{visible}", String(visibleCount));

    for (const output of summaries) output.textContent = summary;
    if (emptyState) emptyState.hidden = visibleCount !== 0;

    if (animate && !reducedMotion) {
      requestAnimationFrame(() => {
        for (const card of cards) {
          if (card.hidden) continue;
          const previous = previousRects.get(card);
          const current = card.getBoundingClientRect();
          if (typeof card.animate !== "function") continue;
          const keyframes = previous
            ? [
                {
                  transform: `translate(${previous.left - current.left}px, ${previous.top - current.top}px) scale(0.985)`,
                  opacity: 0.72,
                },
                { transform: "translate(0, 0) scale(1)", opacity: 1 },
              ]
            : [
                { transform: "translateY(18px) scale(0.9)", opacity: 0 },
                { transform: "translateY(0) scale(1)", opacity: 1 },
              ];

          card.getAnimations?.().forEach((animation) => animation.cancel());
          card.animate(keyframes, {
            duration: previous ? 420 : 360,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "both",
          });
        }

        window.setTimeout(() => {
          (window as typeof window & { ScrollTrigger?: { refresh?: () => void } })
            .ScrollTrigger?.refresh?.();
        }, 440);
      });
    }
  };

  for (const control of controls) {
    control.addEventListener("click", () => {
      const category = control.dataset.filterCategory || "";

      if (category === "all") {
        activeCategories.clear();
      } else if (activeCategories.has(category)) {
        activeCategories.delete(category);
      } else if (category) {
        activeCategories.add(category);
      }

      render(true);

      if (control.closest(".filter-container")) {
        document.body.setAttribute("data-nav-filter-status", "not-active");
        document.body.setAttribute("data-liquid-overlay-open", "false");
        document
          .querySelectorAll<HTMLElement>("[data-filter-toggle='toggle']")
          .forEach((toggle) => toggle.closest("button")?.setAttribute("aria-expanded", "false"));
      }
    });
  }

  render(false);
}
