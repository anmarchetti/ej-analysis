import { Dispatch, RefObject, SetStateAction, useEffect, useState } from 'react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { debounce } from 'frontend/utils/debounce';

const DEBOUNCE_DELAY = 10;
const STICKY_TRIGGER_OFFSET = -10;
const STICKY_RESET_OFFSET = 40;

export const useStickyScrollEffect = ({
    isStickyOnMobile,
    isBodyScrollLocked,
    isBodyScrollLockedViaBlur,
    searchStickyWrRef,
    searchStickyBoxRef,
    setIsExpanded,
    isCollapsedMobileVariant,
}: {
    isBodyScrollLocked: boolean;
    isBodyScrollLockedViaBlur: boolean;
    isCollapsedMobileVariant: boolean;
    isStickyOnMobile: boolean;
    searchStickyBoxRef: RefObject<HTMLElement>;
    searchStickyWrRef: RefObject<HTMLElement>;
    setIsExpanded: Dispatch<SetStateAction<boolean>>;
}): { isSticky: boolean } => {
    const [isSticky, setIsSticky] = useState<boolean>(false);
    const isMobile = useMobileViewport();

    useEffect(() => {
        const scrollHandler = (): void => {
            if (
                (!isStickyOnMobile && isMobile) ||
                !searchStickyWrRef.current ||
                isBodyScrollLockedViaBlur ||
                isBodyScrollLocked
            ) {
                return;
            }

            const offset = searchStickyWrRef.current.getBoundingClientRect().bottom;
            let stickyOffset = 0;

            if (searchStickyBoxRef.current) {
                stickyOffset = searchStickyBoxRef.current.getBoundingClientRect().bottom;
            }

            if (!isSticky && offset < STICKY_TRIGGER_OFFSET) {
                setIsSticky(true);
                setIsExpanded(false);
            } else if (isSticky && offset > stickyOffset) {
                setIsSticky(false);
                setIsExpanded(!isCollapsedMobileVariant);
            } else if (isSticky && offset > STICKY_RESET_OFFSET) {
                // fix sticky for isCollapsedMobileVariant
                setIsSticky(false);
            }
        };

        const debouncedScrollHandler = debounce(scrollHandler, DEBOUNCE_DELAY);

        document.addEventListener('scroll', debouncedScrollHandler);

        return () => {
            document.removeEventListener('scroll', debouncedScrollHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSticky, isBodyScrollLockedViaBlur]);

    return { isSticky };
};
