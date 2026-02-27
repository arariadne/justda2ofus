import React, { useMemo, useState } from "react";
import "./Notebook.css";

function formatDate(ts) {
  try {
    return ts?.toDate ? ts.toDate().toLocaleString() : "";
  } catch {
    return "";
  }
}

const MediaView = ({ item }) => {
  if (!item) return null;

  if (item.kind === "video") {
    return <video className="nb-media" src={item.url} controls />;
  }

  if (item.kind === "pdf") {
    return (
      <a className="nb-pdfLink" href={item.url} target="_blank" rel="noreferrer">
        📄 Open PDF
      </a>
    );
  }

  return <img className="nb-media" src={item.url} alt="memory" />;
};

const Page = ({ post, pageIndex, currentIndex }) => {
  // Small internal carousel for media in a post
  const media = post?.media || [];
  const [mediaIdx, setMediaIdx] = useState(0);
  const item = media[mediaIdx];

  // page flip logic
  const isFlipped = pageIndex <= currentIndex; // pages up to currentIndex are "turned"
  const z = 1000 - pageIndex; // keep proper stacking

  return (
    <div className="nb-page" style={{ zIndex: z }}>
      <div className={`nb-pageInner ${isFlipped ? "flipped" : ""}`}>
        {/* FRONT SIDE */}
        <div className="nb-face nb-front">
          <div className="nb-pageHeader">
            <div className="nb-album">{post.albumName || "Album"}</div>
            <div className="nb-date">{formatDate(post.timestamp)}</div>
          </div>

          <div className="nb-frame">
            <MediaView item={item} />
          </div>

          {media.length > 1 && (
            <div className="nb-mediaNav">
              <button
                className="nb-miniBtn"
                onClick={() => setMediaIdx((v) => Math.max(0, v - 1))}
                disabled={mediaIdx === 0}
              >
                ‹
              </button>

              <div className="nb-dots">
                {media.map((_, i) => (
                  <span key={i} className={`nb-dot ${i === mediaIdx ? "active" : ""}`} />
                ))}
              </div>

              <button
                className="nb-miniBtn"
                onClick={() => setMediaIdx((v) => Math.min(media.length - 1, v + 1))}
                disabled={mediaIdx === media.length - 1}
              >
                ›
              </button>
            </div>
          )}

          <div className="nb-caption">
            <span className="nb-captionTitle">Note:</span>{" "}
            {post.caption || "—"}
          </div>

          <div className="nb-pageNumber">Page {pageIndex + 1}</div>
        </div>

        {/* BACK SIDE */}
        <div className="nb-face nb-back">
          <div className="nb-backText">
            <div className="nb-backTitle">💕</div>
            <div className="nb-backBody">
              Another page in our story.
              <br />
              Turn the page →
            </div>
          </div>
          <div className="nb-pageNumber"> </div>
        </div>
      </div>
    </div>
  );
};

const Notebook = ({ posts }) => {
  // Add a cover page at index 0
  const pages = useMemo(() => {
    const cover = {
      id: "cover",
      albumName: posts?.[0]?.albumName || "Our Album",
      caption: "A little notebook of memories.",
      media: [],
      timestamp: null,
      isCover: true,
    };
    return [cover, ...(posts || [])];
  }, [posts]);

  // currentIndex controls which pages are flipped
  // 0 = cover closed
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = pages.length;

  const next = () => setCurrentIndex((v) => Math.min(total - 1, v + 1));
  const prev = () => setCurrentIndex((v) => Math.max(0, v - 1));

  return (
    <div className="nb-wrap">
      <div className="nb-toolbar">
        <button className="nb-btn" onClick={prev} disabled={currentIndex === 0}>
          ◀ Prev
        </button>

        <div className="nb-counter">
          {currentIndex}/{total - 1} turned
        </div>

        <button className="nb-btn" onClick={next} disabled={currentIndex === total - 1}>
          Next ▶
        </button>
      </div>

      <div className="nb-book">
        <div className="nb-spine" />

        <div className="nb-stack">
          {/* Cover is just a styled first page */}
          {pages.map((p, idx) => {
            if (p.id === "cover") {
              const isFlipped = idx <= currentIndex;
              const z = 1000 - idx;

              return (
                <div key="cover" className="nb-page" style={{ zIndex: z }}>
                  <div className={`nb-pageInner ${isFlipped ? "flipped" : ""}`}>
                    <div className="nb-face nb-front nb-cover">
                      <div className="nb-coverTitle">{p.albumName}</div>
                      <div className="nb-coverSub">Notebook of Memories</div>
                      <div className="nb-coverHint">Turn the page →</div>
                    </div>
                    <div className="nb-face nb-back nb-coverBack">
                      <div className="nb-coverBackText">
                        💌 This notebook holds our favorite moments.
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Page
                key={p.id}
                post={p}
                pageIndex={idx}
                currentIndex={currentIndex}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Notebook;