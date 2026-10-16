import { chinaClock } from "./schedule-timeline";

export function initTimeline(root: HTMLElement, now: () => Date = () => new Date()) {
  if (root.dataset.timelineInitialized === "true") return;
  root.dataset.timelineInitialized = "true";
  const zh = root.dataset.lang === "zh";
  const days = [...root.querySelectorAll<HTMLButtonElement>("[data-timeline-day]")];
  const time = root.querySelector<HTMLSelectElement>("[data-timeline-time]")!;
  const options = [...time.options];
  const tracks = [...root.querySelectorAll<HTMLInputElement>("[data-timeline-track]")];
  const windows = [...root.querySelectorAll<HTMLElement>("[data-timeline-window]")];
  const status = root.querySelector<HTMLElement>("[data-timeline-status]")!;
  const empty = root.querySelector<HTMLElement>("[data-timeline-empty]")!;
  const selection = root.querySelector<HTMLElement>("[data-timeline-selection]")!;
  const toolbar = root.querySelector<HTMLElement>(".timeline-toolbar");
  if (toolbar) {
    const floatingNav = document.querySelector<HTMLElement>("header .floating-controls");
    const ticketBanner = document.querySelector<HTMLElement>(".ticket-promotion");
    const measureToolbar = () => {
      root.style.setProperty("--timeline-toolbar-height", `${toolbar.getBoundingClientRect().height}px`);
      if (floatingNav) root.style.setProperty("--timeline-sticky-top", `${floatingNav.getBoundingClientRect().bottom + 8}px`);
    };
    measureToolbar();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measureToolbar);
      observer.observe(toolbar);
      if (floatingNav) observer.observe(floatingNav);
      if (ticketBanner) observer.observe(ticketBanner);
    }
  }
  const today = chinaClock(now()).date;
  let date = days.find((day) => day.dataset.timelineDay === today)?.dataset.timelineDay || days[0]?.dataset.timelineDay || "";
  const revealStart = () => {
    if (root.getBoundingClientRect().top < (parseFloat(getComputedStyle(root).scrollMarginTop) || 0)) {
      root.scrollIntoView({ block: "start", behavior: "instant" });
    }
  };

  const update = () => {
    const selected = new Set(tracks.filter((track) => track.checked).map((track) => track.dataset.timelineTrack));
    selection.textContent = selected.size === tracks.length ? (zh ? "全部分论坛" : "All tracks")
      : zh ? `已选 ${selected.size} / ${tracks.length}` : `${selected.size} of ${tracks.length} selected`;
    let visible = 0;
    windows.forEach((window) => {
      let count = 0;
      window.querySelectorAll<HTMLElement>("[data-timeline-entry]").forEach((entry) => {
        entry.hidden = !selected.has(entry.dataset.track);
        if (!entry.hidden) count++;
      });
      window.hidden = !count || (window.dataset.date !== date && window.dataset.date !== "unscheduled")
        || (time.value !== "all" && (window.hasAttribute("data-pending") || window.dataset.start !== time.value));
      if (!window.hidden) visible++;
    });
    empty.hidden = visible > 0;
    // A long agenda can shrink below the current scroll position after filtering.
    if (toolbar && toolbar.getBoundingClientRect().top < (parseFloat(getComputedStyle(toolbar).top) || 0)) {
      root.scrollIntoView({ block: "start", behavior: "instant" });
    }
  };

  const changeDay = (next: string) => {
    date = next;
    days.forEach((day) => day.setAttribute("aria-pressed", String(day.dataset.timelineDay === date)));
    time.replaceChildren(...options.filter((option) => option.value === "all" || option.dataset.date === date));
    time.value = "all";
    status.textContent = "";
    update();
  };
  const leaveNow = () => {
    if (window.location.hash === "#now") history.replaceState(null, "", "#by-time");
  };
  days.forEach((day) => day.addEventListener("click", () => { leaveNow(); changeDay(day.dataset.timelineDay!); revealStart(); }));
  time.addEventListener("change", () => { leaveNow(); status.textContent = ""; update(); revealStart(); });
  tracks.forEach((track) => track.addEventListener("change", () => { status.textContent = ""; update(); }));
  for (const [selector, checked] of [["[data-timeline-all]", true], ["[data-timeline-clear]", false]] as const) {
    root.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => button.addEventListener("click", () => {
      const group = checked ? button.dataset.timelineAll : button.dataset.timelineClear;
      tracks.forEach((track) => {
        if (!group || track.dataset.timelineGroup === group) track.checked = checked;
      });
      status.textContent = "";
      update();
    }));
  }
  const showNow = () => {
    const clock = chinaClock(now());
    if (!days.some((day) => day.dataset.timelineDay === clock.date)) {
      status.textContent = zh ? "“此刻”仅适用于大会日期（北京时间 UTC+8）。" : "Now is available on conference days (China Standard Time, UTC+8).";
      revealStart();
      return;
    }
    changeDay(clock.date);
    const available = windows.filter((window) => !window.hidden && !window.hasAttribute("data-pending"));
    const current = available.find((window) => window.dataset.start! <= clock.time && window.dataset.end! > clock.time);
    const next = current || available.find((window) => window.dataset.start! > clock.time);
    if (next) {
      time.value = next.dataset.start!;
      status.textContent = current ? (zh ? "正在进行 · 北京时间" : "Happening now · China Standard Time")
        : (zh ? "当前没有议程，显示下一个时段。" : "No sessions right now. Showing the next time window.");
    } else {
      status.textContent = zh ? "所选分论坛今日已无后续议程，可查看全天安排或选择其他分论坛。" : "No more sessions today in the selected tracks. Browse all times or choose other tracks.";
    }
    update();
    revealStart();
  };
  root.querySelector<HTMLAnchorElement>("[data-timeline-now]")?.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.replaceState(null, "", "#now");
    showNow();
  });
  const applyNowHash = () => {
    if (root.isConnected && window.location.hash === "#now") showNow();
  };
  changeDay(date);
  applyNowHash();
  window.addEventListener("hashchange", applyNowHash);
  window.addEventListener("pageshow", (event) => { if (event.persisted) applyNowHash(); });
}
