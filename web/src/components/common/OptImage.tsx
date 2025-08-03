import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  placeholder?: string;
  appearAfterLoaded?: boolean;
  container?: React.ComponentType<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }>;
}

const OptImage: React.FC<OptImageProps> = React.memo(({
  src,
  alt,
  fallbackSrc,
  placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  appearAfterLoaded = false,
  container: Container,
  ...imgProps
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);
  const currentSrcRef = useRef<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Cleanup function to revoke object URLs
  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupObjectUrl();
    };
  }, [cleanupObjectUrl]);

  useEffect(() => {
    // If src hasn't changed, don't reload
    if (currentSrcRef.current === src) {
      return;
    }

    currentSrcRef.current = src;

    // Reset states
    setIsLoading(true);
    setHasError(false);
    setImageSrc(placeholder);

    // Cleanup previous object URL
    cleanupObjectUrl();

    if (!src) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // For external URLs, use direct src to avoid fetch issues
    if (src.startsWith('http') && !src.includes('blob:')) {
      setImageSrc(src);
      setIsLoading(false);
      return;
    }

    // For data URLs or blob URLs, use directly
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setImageSrc(src);
      setIsLoading(false);
      return;
    }

    // For relative URLs or other cases, try fetch
    const loadImage = async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error('Network response was not ok');

        if (!mountedRef.current) return;

        const blob = await response.blob();
        if (!mountedRef.current) return;

        const dataUrl = URL.createObjectURL(blob);
        objectUrlRef.current = dataUrl;

        if (mountedRef.current) {
          setImageSrc(dataUrl);
          setIsLoading(false);
        }
      } catch (error) {
        if (!mountedRef.current) return;

        console.warn(`Failed to load image: ${src}`, error);

        if (fallbackSrc) {
          setImageSrc(fallbackSrc);
          setIsLoading(false);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();
  }, [src, fallbackSrc, placeholder, cleanupObjectUrl]);

  // Handle image load events
  const handleLoad = useCallback(() => {
    if (mountedRef.current) {
      setIsLoading(false);
      setHasError(false);
    }
  }, []);

  const handleError = useCallback(() => {
    if (mountedRef.current) {
      setHasError(true);
      setIsLoading(false);
      if (fallbackSrc && imageSrc !== fallbackSrc) {
        setImageSrc(fallbackSrc);
      }
    }
  }, [fallbackSrc, imageSrc]);

  // If appearAfterLoaded is true and we're still loading or have an error, return null
  if (appearAfterLoaded && (isLoading || hasError)) {
    return null;
  }

  if (hasError && !fallbackSrc) {
    return null;
  }

  const imageElement = (
    <>
      {isLoading && !appearAfterLoaded && (
        <Skeleton
          className={`${imgProps.className || ''} absolute inset-0`}
          style={imgProps.style}
        />
      )}
      <img
        {...imgProps}
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${imgProps.className || ''} ${isLoading && !appearAfterLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </>
  );

  // If container is provided, wrap the image in it
  if (Container) {
    return (
      <Container
        className={imgProps.className}
        style={imgProps.style}
      >
        {imageElement}
      </Container>
    );
  }

  // Otherwise return the image directly
  return imageElement;
});

OptImage.displayName = 'OptImage';

export default OptImage;
