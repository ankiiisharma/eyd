import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { ChevronDown } from "lucide-react";

type QualityOption = { label: string; levelIndex: number }; // levelIndex: -1 means AUTO

interface Props {
  src: string; // your CloudFront m3u8 URL
  poster?: string; // optional thumbnail
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
}

const HlsPlayer: React.FC<Props> = ({
  src,
  poster,
  autoPlay = false,
  muted = false,
  controls = true,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [qualities, setQualities] = useState<QualityOption[]>([
    { label: "Auto", levelIndex: -1 },
  ]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = AUTO
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNativePlayback, setIsNativePlayback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const canUseNative = video.canPlayType("application/vnd.apple.mpegurl");

    if (canUseNative) {
      video.src = src;
      setIsNativePlayback(true);
      return;
    }

    setIsNativePlayback(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        capLevelToPlayerSize: false,
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
        const opts: QualityOption[] = [
          { label: "Auto", levelIndex: -1 },
          ...data.levels.map((lvl: any, idx: number) => {
            const label = lvl.height
              ? `${lvl.height}p`
              : `${Math.round((lvl.bitrate || 0) / 1000)} kbps`;
            return { label, levelIndex: idx };
          }),
        ];

        setQualities(opts);
        setCurrentLevel(-1);
      });

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        const { fatal, type } = data;
        if (!fatal) return;
        if (type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      console.warn("HLS is not supported in this browser.");
    }
  }, [src]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMenuOpen]);

  const handleQualityChange = (level: number) => {
    setCurrentLevel(level);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
    } else if (
      videoRef.current &&
      videoRef.current.canPlayType("application/vnd.apple.mpegurl")
    ) {
      // Native playback: browser handles quality automatically.
    }
    setIsMenuOpen(false);
  };

  const currentQualityLabel =
    qualities.find((q) => q.levelIndex === currentLevel)?.label || qualities[0]?.label || "Auto";

  const rootClassName = ["relative flex flex-col", className].filter(Boolean).join(" ");

  const showQualityControls = !isNativePlayback && qualities.length >= 1;

  return (
    <div className={rootClassName}>
      <div className="relative w-full h-full">
        <div className="w-full h-full flex items-center justify-center bg-black/80 rounded-2xl">
          <video
            ref={videoRef}
            controls={controls}
            autoPlay={autoPlay}
            muted={muted}
            poster={poster}
            playsInline
            className="w-full h-full max-h-[70vh] object-contain rounded-2xl bg-black"
          />
        </div>

        {showQualityControls && (
          <div className="absolute top-4 right-4 z-20" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-white shadow-lg border border-white/10 hover:bg-black/70 transition"
            >
              <span>{qualities.length > 1 ? "Quality" : "Stream"}: {currentQualityLabel}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isMenuOpen && (
              <div className="mt-2 w-32 rounded-xl bg-white/95 backdrop-blur shadow-xl ring-1 ring-black/10 overflow-hidden">
                {qualities.map((quality) => {
                  const isActive = quality.levelIndex === currentLevel;
                  return (
                    <button
                      key={quality.label}
                      type="button"
                      onClick={() => handleQualityChange(quality.levelIndex)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-[#012765] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {quality.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HlsPlayer;

