import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupCoverFlows } from "../src/scripts/coverflow";

describe("conference photo cover flow", () => {
  let root: HTMLElement;
  let slides: HTMLButtonElement[];
  let dialog: HTMLDialogElement;
  let setInView: (visible: boolean) => void;
  let motionChange: (event: MediaQueryListEvent) => void;
  const click = (selector: string) => root.querySelector<HTMLButtonElement>(selector)!.click();
  const key = (value: string) => root.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }));

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => { motionChange = listener; },
      removeEventListener: () => {},
    } as unknown as MediaQueryList);
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionObserverCallback) {
        setInView = visible => callback([{ isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      observe() { setInView(true); }
      disconnect() {}
    });
    document.body.innerHTML = `<div data-coverflow>
      <div data-coverflow-stage>${Array.from({ length: 10 }, (_, i) => `<button data-coverflow-slide data-caption="Photo ${i + 1}" data-full-src="/photo-${i + 1}.webp" data-photo-alt="Scene ${i + 1}" data-select-label="Select photo" data-open-label="Enlarge photo"></button>`).join("")}</div>
      <button data-coverflow-prev></button><button data-coverflow-next></button>
      <button data-coverflow-autoplay data-play-label="Play slideshow" data-pause-label="Pause slideshow"></button>
      ${Array.from({ length: 10 }, () => "<button data-coverflow-dot></button>").join("")}
      <dialog data-coverflow-dialog><button data-coverflow-close></button><button data-coverflow-lightbox-prev></button><img data-coverflow-full-image alt=""><button data-coverflow-lightbox-next></button></dialog>
    </div>`;
    root = document.querySelector<HTMLElement>("[data-coverflow]")!;
    slides = [...root.querySelectorAll<HTMLButtonElement>("[data-coverflow-slide]")];
    dialog = root.querySelector<HTMLDialogElement>("dialog")!;
    setupCoverFlows();
  });
  afterEach(() => {
    document.dispatchEvent(new Event("astro:before-swap"));
    document.body.innerHTML = "";
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("wraps in both directions and exposes only the current photo as a tab stop", () => {
    click("[data-coverflow-prev]");
    expect(root.dataset.activePhoto).toBe("9");
    expect(slides[9].getAttribute("aria-current")).toBe("true");
    expect(slides.filter(slide => slide.tabIndex === 0)).toEqual([slides[9]]);
    expect(slides[9].getAttribute("aria-label")).toBe("Enlarge photo: Photo 10");
    click("[data-coverflow-next]");
    expect(root.dataset.activePhoto).toBe("0");
    expect(slides[0].getAttribute("aria-label")).toBe("Enlarge photo: Photo 1");
  });

  it("selects a side photo before opening it and keeps the large view in sync", () => {
    slides[1].click();
    expect(root.dataset.activePhoto).toBe("1");
    expect(dialog.open).toBe(false);
    slides[1].click();
    expect(dialog.open).toBe(true);
    expect(root.querySelector("[data-coverflow-full-image]")!.getAttribute("src")).toBe("/photo-2.webp");
    click("[data-coverflow-lightbox-next]");
    expect(root.dataset.activePhoto).toBe("2");
    expect(root.querySelector("[data-coverflow-full-image]")!.getAttribute("alt")).toBe("Scene 3");
    click("[data-coverflow-close]");
    expect(dialog.open).toBe(false);
  });

  it("supports arrow keys, Home and End without scrolling the page", () => {
    key("End");
    expect(root.dataset.activePhoto).toBe("9");
    expect(document.activeElement).toBe(slides[9]);
    key("ArrowRight");
    expect(root.dataset.activePhoto).toBe("0");
    key("ArrowLeft");
    expect(root.dataset.activePhoto).toBe("9");
    key("Home");
    expect(root.dataset.activePhoto).toBe("0");
  });

  it("updates dot selection and does not register duplicate handlers", () => {
    setupCoverFlows();
    click("[data-coverflow-next]");
    expect(root.dataset.activePhoto).toBe("1");
    root.querySelectorAll<HTMLButtonElement>("[data-coverflow-dot]")[5].click();
    expect(root.dataset.activePhoto).toBe("5");
    expect(root.querySelectorAll('[data-coverflow-dot][aria-pressed="true"]')).toHaveLength(1);
    expect(slides[0].getAttribute("aria-hidden")).toBe("true");
  });

  it("recognizes horizontal swipes while preserving vertical scrolling and suppressing accidental opens", () => {
    const stage = root.querySelector<HTMLElement>("[data-coverflow-stage]")!;
    const swipe = (x: number, y: number) => {
      stage.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, isPrimary: true, button: 0, clientX: 200, clientY: 100, bubbles: true }));
      stage.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y, bubbles: true }));
    };
    swipe(190, 200);
    expect(root.dataset.activePhoto).toBe("0");
    swipe(100, 110);
    expect(root.dataset.activePhoto).toBe("1");
    slides[1].click();
    expect(dialog.open).toBe(false);
  });

  it("automatically advances every four seconds and loops through all ten photos", () => {
    vi.advanceTimersByTime(3999);
    expect(root.dataset.activePhoto).toBe("0");
    vi.advanceTimersByTime(1);
    expect(root.dataset.activePhoto).toBe("1");
    vi.advanceTimersByTime(36_000);
    expect(root.dataset.activePhoto).toBe("0");
    expect(root.dataset.autoplayState).toBe("playing");
  });

  it("pauses on mouse hover and keyboard focus, then resumes after leaving", () => {
    root.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    vi.advanceTimersByTime(8000);
    expect(root.dataset.activePhoto).toBe("0");
    root.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
    vi.advanceTimersByTime(4000);
    expect(root.dataset.activePhoto).toBe("1");
    slides[1].focus();
    vi.advanceTimersByTime(8000);
    expect(root.dataset.activePhoto).toBe("1");
    slides[1].blur();
    vi.advanceTimersByTime(4000);
    expect(root.dataset.activePhoto).toBe("2");
  });

  it("does not advance outside the viewport, on a hidden page, or in the large viewer", () => {
    setInView(false);
    vi.advanceTimersByTime(8000);
    expect(root.dataset.activePhoto).toBe("0");
    setInView(true);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(8000);
    expect(root.dataset.activePhoto).toBe("0");
    vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(4000);
    expect(root.dataset.activePhoto).toBe("1");
    slides[1].click();
    vi.advanceTimersByTime(8000);
    expect(dialog.open).toBe(true);
    expect(root.dataset.activePhoto).toBe("1");
  });

  it("supports explicit pause and play and stops when reduced motion is requested", () => {
    click("[data-coverflow-autoplay]");
    vi.advanceTimersByTime(8000);
    expect(root.dataset.activePhoto).toBe("0");
    expect(root.querySelector("[data-coverflow-autoplay]")!.getAttribute("aria-label")).toBe("Play slideshow");
    click("[data-coverflow-autoplay]");
    vi.advanceTimersByTime(4000);
    expect(root.dataset.activePhoto).toBe("1");
    motionChange({ matches: true } as MediaQueryListEvent);
    vi.advanceTimersByTime(8000);
    expect(root.dataset.activePhoto).toBe("1");
  });

  it("clears playback when the page is replaced", () => {
    document.dispatchEvent(new Event("astro:before-swap"));
    vi.advanceTimersByTime(8000);
    expect(root.dataset.activePhoto).toBe("0");
  });
});
