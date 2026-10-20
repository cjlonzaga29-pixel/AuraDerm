"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type SyntheticEvent,
} from "react";
import { Pause, Play } from "lucide-react";

type ScrollStageProps = {
  hero1280Src: string;
  hero720Src: string;
  posterSrc: string;
};

const DESKTOP_BREAKPOINT = 768;

function logPlayRejection() {
  console.debug("[ScrollStage] video play() rejected — leaving poster visible");
}

function logVideoError(label: string) {
  return (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    console.error(
      `[ScrollStage] ${label} video failed to decode (code=${video.error?.code ?? "unknown"})`,
    );
  };
}

function subscribeToViewport(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getViewportSnapshot() {
  return window.innerWidth >= DESKTOP_BREAKPOINT;
}

function getViewportServerSnapshot() {
  return false;
}

function subscribeToMotionPreference(callback: () => void) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionQuery.addEventListener("change", callback);
  return () => motionQuery.removeEventListener("change", callback);
}

function getMotionSnapshot() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
    true;
  return reducedMotion || saveData;
}

function getMotionServerSnapshot() {
  return false;
}

function subscribeOnce() {
  return () => {};
}

function getHydratedSnapshot() {
  return true;
}

function getHydratedServerSnapshot() {
  return false;
}

export function ScrollStage({ hero1280Src, hero720Src, posterSrc }: ScrollStageProps) {
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  // A viewer-initiated pause must win over every automatic resume path below
  // (tab visibility, loop fallback, autoplay retry, breakpoint remount).
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);

  // The real viewport width is unknown to the server, so the hydration-matching
  // render always has to guess "mobile" first. Gate the <video> mount on this
  // flag so that guess never becomes a real DOM element — the keyed remount
  // below (added to force a reload on genuine breakpoint changes) would
  // otherwise fire during every hydration, fetching the wrong source variant
  // and resetting playback position on first load.
  const hydrated = useSyncExternalStore(
    subscribeOnce,
    getHydratedSnapshot,
    getHydratedServerSnapshot,
  );

  const isDesktop = useSyncExternalStore(
    subscribeToViewport,
    getViewportSnapshot,
    getViewportServerSnapshot,
  );
  const disableMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionSnapshot,
    getMotionServerSnapshot,
  );

  useEffect(() => {
    if (disableMotion) return;
    const heroVideo = heroVideoRef.current;
    if (!heroVideo) return;

    // The `muted` attribute only seeds the native `muted` property when an
    // element is parsed from HTML. The hero video can instead be created by
    // React on the client (e.g. swapped in for the poster <img> after the
    // reduced-motion check resolves post-hydration), so autoplay policies
    // see `muted` as false unless we set the property explicitly.
    heroVideo.defaultMuted = true;
    heroVideo.muted = true;

    // Some browsers (notably Safari under stricter autoplay heuristics) can
    // still reject play() even with muted set. Once that happens, arm a
    // one-time fallback that retries on the first user interaction, rather
    // than leaving the video permanently stuck on the poster frame.
    let fallbackArmed = false;
    let retryOnInteraction: (() => void) | null = null;
    const armAutoplayFallback = () => {
      if (fallbackArmed) return;
      fallbackArmed = true;
      retryOnInteraction = () => {
        if (userPausedRef.current) return;
        heroVideo.play().catch(logPlayRejection);
      };
      window.addEventListener("click", retryOnInteraction, { once: true });
      window.addEventListener("touchstart", retryOnInteraction, { once: true });
      window.addEventListener("scroll", retryOnInteraction, { once: true });
    };
    const attemptPlay = (video: HTMLVideoElement) => {
      video.play().catch(() => {
        logPlayRejection();
        armAutoplayFallback();
      });
    };

    const onVisibility = () => {
      if (document.hidden) {
        heroVideo.pause();
      } else if (!userPausedRef.current) {
        attemptPlay(heroVideo);
      }
    };

    // Some browsers/webviews silently ignore the native `loop` attribute
    // (observed under low-power/battery-saver modes), leaving the video
    // paused on its final frame after one cycle. Force a restart on `ended`
    // as a fallback so playback never stalls.
    const onHeroEnded = () => {
      heroVideo.currentTime = 0;
      if (!userPausedRef.current) attemptPlay(heroVideo);
    };

    if (!userPausedRef.current) attemptPlay(heroVideo);
    document.addEventListener("visibilitychange", onVisibility);
    heroVideo.addEventListener("ended", onHeroEnded);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      heroVideo.removeEventListener("ended", onHeroEnded);
      if (retryOnInteraction) {
        window.removeEventListener("click", retryOnInteraction);
        window.removeEventListener("touchstart", retryOnInteraction);
        window.removeEventListener("scroll", retryOnInteraction);
      }
    };
  }, [disableMotion, isDesktop, hydrated]);

  const showVideo = hydrated && !disableMotion;

  const togglePlayback = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    const nextPaused = !userPausedRef.current;
    userPausedRef.current = nextPaused;
    setUserPaused(nextPaused);
    if (nextPaused) {
      video.pause();
    } else {
      video.play().catch(logPlayRejection);
    }
  };

  return (
    <>
      <div
        data-testid="scroll-stage"
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
      >
        {/* Phones crop the 16:9 loop to a narrow slice; 72% keeps the serum
            bottle centred between the hero's headline and its copy/CTAs. */}
        {!showVideo ? (
          <img
            data-testid="stage-poster"
            src={posterSrc}
            alt=""
            className="h-full w-full object-cover object-[72%_50%] md:object-[78%_50%]"
          />
        ) : (
          <video
            key={isDesktop ? "desktop" : "mobile"}
            ref={heroVideoRef}
            data-testid="stage-video-a"
            muted
            playsInline
            autoPlay={!userPaused}
            loop
            preload="auto"
            poster={posterSrc}
            className="h-full w-full object-cover object-[72%_50%] md:object-[78%_50%]"
            onError={logVideoError("hero")}
          >
            <source src={isDesktop ? hero1280Src : hero720Src} type="video/mp4" />
          </video>
        )}
      </div>
      {showVideo ? (
        // Outside the aria-hidden, pointer-events-none stage so it stays
        // reachable by keyboard and assistive tech (WCAG 2.2.2 pause control).
        <button
          type="button"
          data-testid="stage-playback"
          onClick={togglePlayback}
          aria-label={userPaused ? "Play background video" : "Pause background video"}
          className="fixed right-4 bottom-4 z-40 flex size-10 items-center justify-center rounded-full border border-glass-border bg-forest-deep/70 text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:right-6 md:bottom-6"
        >
          {userPaused ? (
            <Play className="size-4" aria-hidden="true" />
          ) : (
            <Pause className="size-4" aria-hidden="true" />
          )}
        </button>
      ) : null}
    </>
  );
}
