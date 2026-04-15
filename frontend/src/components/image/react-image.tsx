import { Img } from 'react-image';
import { cn } from '@/lib/utils';
import fallbackImage from '/images/image-not-found.png';

type ReactImageProps = {
  className?: string;
  baseUrl?: string;
  imagePath?: string;
  fallback?: string;
  alt?: string;
};

const ReactImage = ({
  className,
  baseUrl,
  imagePath,
  fallback = fallbackImage,
  alt,
}: ReactImageProps) => {
  if (!imagePath) {
    return <Img className={className} src={fallback} alt={alt} />;
  }

  return (
    <Img
      className={className}
      src={`${baseUrl ? baseUrl + imagePath : imagePath}`}
      loader={
        <div
          className={cn('h-full w-full animate-pulse bg-primary', className)}
        />
      }
      unloader={<img className={className} src={fallback} alt={alt} />}
    />
  );
};

export default ReactImage;
