import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";
import ImageCard from "./ImageCard";

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

// TODO Need debugging.
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

  // Scroll to top when filter changes
  useEffect(() => {
    rowVirtualizer.scrollToIndex(0);
    setCurrentFilter(currentFilter);
  }, [currentFilter, rowVirtualizer]);

  const updateColumns = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setColumns(4);
    } else if (window.matchMedia("(min-width: 768px)").matches) {
      setColumns(3);
    } else if (window.matchMedia("(min-width: 640px)").matches) {
      setColumns(2);
    } else {
      setColumns(1);
    }
  }, []);

  useEffect(() => {
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [updateColumns]);

  const handleImageClick = (image: ImageData) => {
    // Update hash in URL
    const hash = encodeURIComponent(image.path.replace(".webp", "")).replace(
      /%2F/g,
      "+",
    );
    history.replaceState(null, "", `#${hash}`);

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

              return (
                <ImageCard
                  key={virtualColumn.key}
                  path={image.path}
                  width={image.pathWidth}
                  height={image.pathHeight}
                  placeholder={image.pathPlaceholder}
                  name={image.name}
                  note={image.note}
                  icon={image.icon}
                  video={image.video}
                  onClick={() => handleImageClick(image)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualGallery;
