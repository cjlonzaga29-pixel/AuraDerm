"use client";

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type SyntheticEvent,
} from "react";

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

export function ScrollStage({ hero1280Src, hero720Src, posterSrc }: ScrollStageProps) {
  const heroVideoRef = useRef<HTMLVideoElement>(null);

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
      } else {
        attemptPlay(heroVideo);
      }
    };

    // Some browsers/webviews silently ignore the native `loop` attribute
    // (observed under low-power/battery-saver modes), leaving the video
    // paused on its final frame after one cycle. Force a restart on `ended`
    // as a fallback so playback never stalls.
    const onHeroEnded = () => {
      heroVideo.currentTime = 0;
      attemptPlay(heroVideo);
    };

    attemptPlay(heroVideo);
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
  }, [disableMotion, isDesktop]);

  return (
    <div
      data-testid="scroll-stage"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    >
      {disableMotion ? (
        <img
          data-testid="stage-poster"
          src={posterSrc}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          ref={heroVideoRef}
          data-testid="stage-video-a"
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          poster={posterSrc}
          className="h-full w-full object-cover"
          onError={logVideoError("hero")}
        >
          <source src={isDesktop ? hero1280Src : hero720Src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
