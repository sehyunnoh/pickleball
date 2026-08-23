"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  youtubeId: string;
  title: string;
  /** Seconds. The clip starts here — this is the point of the site. */
  start?: number;
  end?: number;
  /** Set on the hero video only, so the thumbnail is the LCP image. */
  priority?: boolean;
};

/**
 * A facade embed: we render a thumbnail and only create the YouTube <iframe>
 * once the visitor clicks play.
 *
 * A technique page carries up to five clips. Five real iframes is several
 * megabytes of third-party script before the page is usable, which sinks LCP
 * on the phone-at-the-court scenario this site is built for.
 *
 * Uses youtube-nocookie.com so no tracking cookie is set for visitors who
 * never press play.
 */
export default function LiteYouTube({
  youtubeId,
  title,
  start = 0,
  end,
  priority = false,
}: Props) {
  const [activated, setActivated] = useState(false);

  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
  });
  if (start > 0) params.set("start", String(start));
  if (end !== undefined) params.set("end", String(end));

  const src = `https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`;

  return (
    <div className="relative aspect-video w-full overflow-hidden border border-border bg-black">
      {activated ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActivated(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          {/* hqdefault is the only thumbnail size YouTube guarantees exists for
              every video. It is 4:3 with letterboxing, so it is cropped to 16:9. */}
          <Image
            src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
            priority={priority}
            unoptimized
          />
          <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/25" />
          <span className="absolute top-1/2 left-1/2 flex h-14 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-black/70 transition-colors group-hover:bg-[#ff0000]">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 fill-white"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
