import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupHeroVideos } from "../src/scripts/hero-video";

describe("hero video playback recovery", () => {
  let video: HTMLVideoElement;
  let button: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = '<section data-hero-video><video></video><button data-video-play hidden>Play</button></section>';
    video = document.querySelector("video")!;
    button = document.querySelector("button")!;
    vi.spyOn(video, "paused", "get").mockReturnValue(true);
    vi.spyOn(video, "getBoundingClientRect").mockReturnValue({
      width: 390, height: 700, top: 0, bottom: 700,
    } as DOMRect);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("sets the muted and inline properties before requesting playback", async () => {
    const play = vi.spyOn(video, "play").mockImplementation(() => {
      expect(video.muted).toBe(true);
      expect(video.defaultMuted).toBe(true);
      expect(video.playsInline).toBe(true);
      return Promise.resolve();
    });
    setupHeroVideos();
    expect(play).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(button.hidden).toBe(true));
  });

  it("offers a synchronous user-gesture retry after autoplay is rejected", async () => {
    const play = vi.spyOn(video, "play")
      .mockRejectedValueOnce(new DOMException("Autoplay blocked", "NotAllowedError"))
      .mockResolvedValue(undefined);
    setupHeroVideos();
    await vi.waitFor(() => expect(button.hidden).toBe(false));
    button.click();
    expect(play).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(button.hidden).toBe(true));
  });

  it("retries when returning to the page after a failed start", async () => {
    const play = vi.spyOn(video, "play")
      .mockRejectedValueOnce(new DOMException("Interrupted", "AbortError"))
      .mockResolvedValue(undefined);
    setupHeroVideos();
    await vi.waitFor(() => expect(button.hidden).toBe(false));
    window.dispatchEvent(new Event("pageshow"));
    await vi.waitFor(() => expect(button.hidden).toBe(true));
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("waits while the page is hidden and resumes when visible", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const play = vi.spyOn(video, "play").mockResolvedValue(undefined);
    setupHeroVideos();
    expect(play).not.toHaveBeenCalled();
    visibility.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(play).toHaveBeenCalledOnce();
  });

  it("does not duplicate pending requests or initialization", async () => {
    let resolve!: () => void;
    const play = vi.spyOn(video, "play").mockReturnValue(new Promise<void>((done) => { resolve = done; }));
    setupHeroVideos();
    setupHeroVideos();
    video.dispatchEvent(new Event("canplay"));
    window.dispatchEvent(new Event("pageshow"));
    button.click();
    expect(play).toHaveBeenCalledOnce();
    resolve();
    await vi.waitFor(() => expect(button.hidden).toBe(true));
  });
});
