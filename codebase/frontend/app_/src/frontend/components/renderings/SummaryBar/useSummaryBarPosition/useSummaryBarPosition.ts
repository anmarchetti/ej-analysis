import { RefObject, useEffect, useRef, useState } from 'react';

import { TWO } from 'code/commonNumbers';

export const MARGIN = 15;

interface ISummaryBarPosition {
    containerRef: RefObject<HTMLDivElement>;
    topOffset: number;
}

export const useSummaryBarPosition = (enabled = true): ISummaryBarPosition => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [topOffset, setTopOffset] = useState<number>(MARGIN);
    const lastScrollY = useRef<number>(0);

    useEffect(() => {
        if (!enabled) return;

        const handleScroll = (): void => {
            if (!containerRef.current) return;

            const barHeight = containerRef.current.getBoundingClientRect().height;
            const viewportHeight = window.innerHeight;

            if (barHeight + MARGIN * TWO <= viewportHeight) {
                setTopOffset(prev => (prev === MARGIN ? prev : MARGIN));

                return;
            }

            const scrollY = window.scrollY;
            const isScrollingDown = scrollY > lastScrollY.current;
            lastScrollY.current = scrollY;

            const nextTopOffset = isScrollingDown ? viewportHeight - barHeight - MARGIN : MARGIN;

            setTopOffset(prev => (prev === nextTopOffset ? prev : nextTopOffset));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });

        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [enabled]);

    return {
        containerRef,
        topOffset,
    };
};
