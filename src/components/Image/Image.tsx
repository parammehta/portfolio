import { Button, Icon } from 'components';
import { useTheme } from 'components/ThemeProvider';
import { useReducedMotion } from 'framer-motion';
import { useHasMounted, useInViewport } from 'hooks';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactEventHandler, VideoHTMLAttributes } from 'react';
import { resolveSrcFromSrcSet, srcSetToString } from 'utils/image';
import { classes, cssProps, numToMs } from 'utils/style';
import styles from './Image.module.css';

interface ImageSrc {
  src: string;
  width?: number;
  height?: number;
}

interface SrcSetItem {
  src: string;
  width: number;
}

interface ImageProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  style?: CSSProperties;
  reveal?: boolean;
  delay?: number;
  raised?: boolean;
  src?: ImageSrc;
  srcSet?: SrcSetItem[];
  placeholder?: ImageSrc;
  alt?: string;
  play?: boolean;
  restartOnPause?: boolean;
  sizes?: string;
  noPauseButton?: boolean;
}

export const Image = ({
  className,
  style,
  reveal,
  delay = 0,
  raised,
  src: baseSrc,
  srcSet,
  placeholder,
  ...rest
}: ImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const { themeId } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const src = baseSrc || srcSet?.[0];
  const inViewport = useInViewport(containerRef, !getIsVideo(src));

  const onLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <div
      className={classes(styles.image, className)}
      data-visible={inViewport || loaded}
      data-reveal={reveal}
      data-raised={raised}
      data-theme={themeId}
      style={cssProps({ delay: numToMs(delay) }, style)}
      ref={containerRef}
    >
      <ImageElements
        delay={delay}
        onLoad={onLoad}
        loaded={loaded}
        inViewport={inViewport}
        reveal={reveal}
        src={src}
        srcSet={srcSet}
        placeholder={placeholder}
        {...rest}
      />
    </div>
  );
};

interface ImageElementsProps {
  onLoad: ReactEventHandler;
  loaded: boolean;
  inViewport: boolean;
  srcSet?: SrcSetItem[];
  placeholder?: ImageSrc;
  delay: number;
  src?: ImageSrc | SrcSetItem;
  alt?: string;
  play?: boolean;
  restartOnPause?: boolean;
  reveal?: boolean;
  sizes?: string;
  noPauseButton?: boolean;
  [key: string]: unknown;
}

const ImageElements = ({
  onLoad,
  loaded,
  inViewport,
  srcSet,
  placeholder,
  delay,
  src,
  alt,
  play = true,
  restartOnPause,
  reveal,
  sizes,
  noPauseButton,
  ...rest
}: ImageElementsProps) => {
  const reduceMotion = useReducedMotion();
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [playing, setPlaying] = useState(!reduceMotion);
  const [videoSrc, setVideoSrc] = useState<string>();
  const [videoInteracted, setVideoInteracted] = useState(false);
  const placeholderRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = getIsVideo(src);
  const showFullRes = inViewport;
  const srcSetString = srcSetToString(srcSet);
  const hasMounted = useHasMounted();

  useEffect(() => {
    const resolveVideoSrc = async () => {
      const resolvedVideoSrc = await resolveSrcFromSrcSet({ srcSet, sizes });
      setVideoSrc(resolvedVideoSrc);
    };

    if (isVideo && srcSet) {
      resolveVideoSrc();
    } else if (isVideo) {
      // Sync counterpart to the async branch above; kept in the same effect
      // so `videoSrc` always resolves the same way regardless of source shape.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVideoSrc((src as ImageSrc).src);
    }
  }, [isVideo, sizes, src, srcSet]);

  useEffect(() => {
    if (!videoRef.current || !videoSrc) return;

    const playVideo = () => {
      setPlaying(true);
      videoRef.current!.play();
    };

    const pauseVideo = () => {
      setPlaying(false);
      videoRef.current!.pause();
    };

    if (!play) {
      pauseVideo();

      if (restartOnPause) {
        videoRef.current.currentTime = 0;
      }
    }

    if (videoInteracted) return;

    if (!inViewport) {
      pauseVideo();
    } else if (inViewport && !reduceMotion && play) {
      playVideo();
    }
  }, [inViewport, play, reduceMotion, restartOnPause, videoInteracted, videoSrc]);

  const togglePlaying = (event: React.MouseEvent) => {
    event.preventDefault();

    setVideoInteracted(true);

    if (videoRef.current!.paused) {
      setPlaying(true);
      videoRef.current!.play();
    } else {
      setPlaying(false);
      videoRef.current!.pause();
    }
  };

  return (
    <div
      className={styles.elementWrapper}
      data-reveal={reveal}
      data-visible={inViewport || loaded}
      style={cssProps({ delay: numToMs(delay + 1000) })}
    >
      {isVideo && hasMounted && (
        <Fragment>
          <video
            muted
            loop
            playsInline
            className={styles.element}
            data-loaded={loaded}
            autoPlay={!reduceMotion}
            role="img"
            onLoadStart={onLoad as ReactEventHandler<HTMLVideoElement>}
            src={videoSrc}
            aria-label={alt}
            ref={videoRef}
            {...(rest as VideoHTMLAttributes<HTMLVideoElement>)}
          />
          {!noPauseButton && (
            <Button className={styles.button} onClick={togglePlaying}>
              <Icon icon={playing ? 'pause' : 'play'} />
              {playing ? 'Pause' : 'Play'}
            </Button>
          )}
        </Fragment>
      )}
      {!isVideo && (
        <img
          className={styles.element}
          data-loaded={loaded}
          onLoad={onLoad}
          decoding="async"
          src={showFullRes ? (src as ImageSrc)?.src : undefined}
          srcSet={showFullRes ? srcSetString : undefined}
          width={(src as ImageSrc)?.width}
          height={(src as ImageSrc)?.height}
          alt={alt}
          sizes={sizes}
          {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)}
        />
      )}
      {showPlaceholder && placeholder && (
        <img
          aria-hidden
          className={styles.placeholder}
          data-loaded={loaded}
          style={cssProps({ delay: numToMs(delay) })}
          ref={placeholderRef}
          src={placeholder.src}
          width={placeholder.width}
          height={placeholder.height}
          onTransitionEnd={() => setShowPlaceholder(false)}
          decoding="async"
          alt=""
          role="presentation"
        />
      )}
    </div>
  );
};

function getIsVideo(src?: ImageSrc | SrcSetItem): boolean {
  if (!src) return false;
  return typeof (src as ImageSrc).src === 'string' && (src as ImageSrc).src.endsWith('.mp4');
}
