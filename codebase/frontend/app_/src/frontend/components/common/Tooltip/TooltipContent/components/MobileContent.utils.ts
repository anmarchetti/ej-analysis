import { CSSProperties, RefObject, useEffect, useRef, useState } from 'react';

import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useSwipe from 'frontend/hooks/useSwipe/useSwipe';

interface IMobileContentProps {
    isAnimationLaunched: boolean;
    refs: { floating: RefObject<HTMLElement>; reference: RefObject<HTMLElement> };
    setIsAnimationLaunched: (v: boolean) => void;
    setOpen: (v: boolean) => void;
}

export interface ITabletContent {
    isShown: boolean;
    onAnimationEnd: () => void;
}

export interface IMobileContent {
    onTouchEnd?: () => void;
    onTouchMove?: (e) => void;
    onTouchStart?: (e) => void;
    onTransitionEnd?: () => void;
    ref?: RefObject<HTMLDivElement>;
    style?: CSSProperties;
}

interface IMobileContentData {
    content: ITabletContent | IMobileContent;
    contentRef: RefObject<HTMLDivElement>;
    isMobile: boolean;
    isOverflow: boolean;
    onClose: () => void;
    overlay: {
        ref: RefObject<HTMLDivElement>;
        style?: CSSProperties;
    };
}

const getOverlayStyle = (y: number | undefined): CSSProperties =>
    y === undefined
        ? {}
        : {
              backgroundColor: `rgba(83, 83, 83, ${((100 - y) * 0.65) / 100})`,
          };

const getContentStyle = ({ y, swiping }: { swiping: boolean; y: number | undefined }): CSSProperties =>
    y === undefined
        ? {}
        : {
              transform: `translateY(${y}%)`,
              ...(swiping ? null : { transition: 'transform .3s linear' }),
          };

const useMobileContent = ({
    setOpen,
    isAnimationLaunched,
    setIsAnimationLaunched,
    refs,
}: IMobileContentProps): IMobileContentData => {
    const isMobile = useXSMobileViewport();
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const [isOverflow, setIsOverflow] = useState(false);

    const onClose = (): void => {
        setOpen(false);
        setIsAnimationLaunched(true);
    };

    const { onChange, handlers, y, swiping, ref } = useSwipe({
        isOn: isMobile,
        onTransitionEnd: onClose,
    });

    useEffect(() => {
        const overlay = overlayRef.current as HTMLDivElement;
        const floating = refs.floating.current as HTMLElement;
        const reference = refs.reference.current as HTMLElement;
        const contentWrapper = document.getElementById('content-wrapper') as HTMLDivElement;

        const onResize = (): void => {
            document.documentElement.style.setProperty('--inner-height', window.innerHeight + 'px');

            if (contentRef.current) {
                setIsOverflow(contentRef.current.scrollHeight > contentRef.current.clientHeight);
            }
        };

        const onExit = (e: KeyboardEvent & MouseEvent): void => {
            const clicked = e.type === 'click' && !contentWrapper.contains(e.target as Node);
            const isKeyMatched = e.key === 'Escape' || e.key === 'Enter' || e.key === ' ';
            const pressed = e.type === 'keydown' && isKeyMatched;

            if (clicked || pressed) {
                setIsAnimationLaunched(false);
            }
        };

        onResize();

        overlay.addEventListener('click', onExit, { passive: true });
        overlay.addEventListener('keydown', onExit, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });

        floating.focus();

        return (): void => {
            overlay.removeEventListener('click', onExit);
            overlay.removeEventListener('keydown', onExit);
            window.removeEventListener('resize', onResize);

            document.documentElement.style.removeProperty('--inner-height');

            reference.focus();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile]);

    useEffect(() => {
        // mobile only: emulate swipe down when clicked outside of the drawer
        if (isMobile && !isAnimationLaunched) {
            onChange?.({ y: 100 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAnimationLaunched]);

    return {
        isMobile,
        onClose: (): void => setIsAnimationLaunched(false),
        overlay: {
            ref: overlayRef,
            style: isMobile ? getOverlayStyle(y) : {},
        },
        content: isMobile
            ? {
                  ...handlers,
                  ref,
                  style: getContentStyle({ y, swiping: swiping as boolean }),
              }
            : {
                  isShown: isAnimationLaunched,
                  onAnimationEnd: onClose,
              },
        contentRef,
        isOverflow,
    };
};

export default useMobileContent;
