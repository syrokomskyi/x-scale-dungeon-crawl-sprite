import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { thumbHashToDataURL } from "thumbhash";

interface ImageData {
  path: string;
  pathWidth: number;
  pathHeight: number;
  pathPlaceholder: string;
  name: string;
  note: string;
  icon: string;
  video: string;
}

interface VirtualGalleryProps {
  images: ImageData[];
  baseUrl: string;
  currentFilter: string[];
}

const VirtualGallery: React.FC<VirtualGalleryProps> = ({ images, baseUrl }) => {
  const [currentFilter, setCurrentFilter] = useState<string[]>([]);
  const [columns, setColumns] = useState<number>(4);
  const parentRef = useRef<HTMLDivElement>(null);

  // Listen to filterChange events
  useEffect(() => {
    const handleFilterChange = (e: CustomEvent) => {
      setCurrentFilter(e.detail.selected);
    };
    window.addEventListener(
      "filterChange",
      handleFilterChange as EventListener,
    );
    return () =>
      window.removeEventListener(
        "filterChange",
        handleFilterChange as EventListener,
      );
  }, []);

  // Filter images based on currentFilter
  const filteredImages = images.filter(
    (image) =>
      currentFilter.length === 0 ||
      image.path.startsWith(`redraw-v1/${currentFilter.join("/")}/`),
  );

  const rowsLength = Math.ceil(filteredImages.length / columns);

  const rowVirtualizer = useWindowVirtualizer({
    count: rowsLength,
    estimateSize: () => 340,
    overscan: 8,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
    gap: 16,
  });

  const columnVirtualizer = useWindowVirtualizer({
    horizontal: true,
    count: columns,
    estimateSize: () => 250,
    overscan: 8,
    gap: 16,
  });

  const updateColumns = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setColumns(4);
    } else if (window.matchMedia("(min-width: 768px)").matches) {
      setColumns(3);
    } else if (window.matchMedia("(min-width: 640px)").matches) {
      setColumns(2);
    } else {
      setColumns(1);
    }
  };

  useEffect(() => {
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [updateColumns]);

  const randomHeartbeatDelay = () => {
    const delay = (Math.random() - 0.5) * 0.24;
    return `${delay.toFixed(3)}s`;
  };

  const handleImageClick = (image: ImageData) => {
    // Update hash in URL
    const hash = encodeURIComponent(image.path.replace(".webp", "")).replace(
      /%2F/g,
      "+",
    );
    history.replaceState(null, null, `#${hash}`);

    document.dispatchEvent(
      new CustomEvent("openFullscreen", {
        detail: {
          path: image.path,
          name: image.name,
          note: image.note,
          icon: image.icon,
          video: image.video,
        },
      }),
    );
  };

  return (
    <div ref={parentRef} className="w-full">
      <div
        className="w-full relative will-change-transform"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className="grid gap-4 w-full absolute top-0 left-0 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            style={{
              transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
            }}
          >
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
              const itemIndex =
                virtualRow.index * columns + virtualColumn.index;
              const image = filteredImages[itemIndex];

              if (!image) return null;

              const dataPlaceholder = thumbHashToDataURL(
                Uint8Array.from(atob(image.pathPlaceholder), (c) =>
                  c.charCodeAt(0),
                ),
              );

              return (
                <div
                  key={virtualColumn.key}
                  data-index={virtualColumn.index}
                  ref={columnVirtualizer.measureElement}
                  className="image-card bg-black/20 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  data-path={image.path}
                  data-note={image.note}
                  data-icon={image.icon}
                  data-video={image.video}
                  onClick={() => handleImageClick(image)}
                >
                  <div
                    className="relative"
                    style={{
                      aspectRatio: `${image.pathWidth} / ${image.pathHeight}`,
                    }}
                  >
                    <img
                      src={dataPlaceholder}
                      width={image.pathWidth}
                      height={image.pathHeight}
                      alt={image.name}
                      className="absolute inset-0 w-full h-full object-cover z-0 blur-lg"
                    />
                    <img
                      src={`${baseUrl}/${image.path}`.replace("//", "/")}
                      width={image.pathWidth}
                      height={image.pathHeight}
                      alt={image.name}
                      title={`${image.name} | ${image.note}`}
                      className="w-full h-full object-contain cursor-pointer absolute inset-0 opacity-0 transition-opacity duration-1200"
                      loading="lazy"
                      onLoad={(e) => (e.currentTarget.style.opacity = "1")}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg text-white mb-2 md:text-base sm:text-sm">
                      {image.icon && (
                        <img
                          src={`${baseUrl}/${image.icon}`.replace("//", "/")}
                          width={32}
                          height={32}
                          alt={image.name}
                          className="heartbeat w-8 h-8 inline mr-2"
                          style={{ animationDelay: randomHeartbeatDelay() }}
                          loading="lazy"
                        />
                      )}
                      {image.name}
                    </h3>
                    {image.note && (
                      <p className="text-base text-gray-300 mt-1 mb-1 px-4 md:text-sm sm:text-xs">
                        {image.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualGallery;
