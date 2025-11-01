/// <reference types="astro/client" />

import { thumbHashToDataURL } from "thumbhash";

interface ImageCardProps {
  path: string;
  width: number;
  height: number;
  placeholder: string;
  name: string;
  note: string;
  icon: string;
  video: string;
  onClick?: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  path,
  width,
  height,
  placeholder,
  name,
  note,
  icon,
  video,
  onClick,
}) => {
  const baseUrl = import.meta.env.BASE_URL;

  const dataPlaceholder = thumbHashToDataURL(
    Uint8Array.from(atob(placeholder), (c) => c.charCodeAt(0)),
  );

  const randomHeartbeatDelay = () => {
    const delay = (Math.random() - 0.5) * 0.24;
    return `${delay.toFixed(3)}s`;
  };

  return (
    <button
      type="button"
      className="image-card bg-transparent backdrop-blur-sm rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-none p-0 cursor-pointer w-full text-left"
      data-path={path}
      data-note={note}
      data-icon={icon}
      data-video={video}
      onClick={onClick}
    >
      <div className="relative" style={{ aspectRatio: `${width} / ${height}` }}>
        <img
          src={dataPlaceholder}
          width={width}
          height={height}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover z-0 blur-lg"
        />
        <img
          src={`${baseUrl}/${path}`.replace("//", "/")}
          width={width}
          height={height}
          alt={name}
          title={`${name} | ${note}`}
          className="w-full h-full object-contain cursor-pointer absolute inset-0 opacity-0 transition-opacity duration-1200"
          loading="lazy"
          onLoad={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg text-white mb-2 md:text-base sm:text-sm">
          {icon && (
            <img
              src={`${baseUrl}/${icon}`.replace("//", "/")}
              width={32}
              height={32}
              alt={name}
              className="heartbeat w-8 h-8 inline mr-2"
              style={{ animationDelay: randomHeartbeatDelay() }}
              loading="lazy"
            />
          )}
          {name}
        </h3>
        {note && (
          <p className="text-base text-gray-300 mt-1 mb-1 px-4 md:text-sm sm:text-xs">
            {note}
          </p>
        )}
      </div>
    </button>
  );
};

export default ImageCard;
