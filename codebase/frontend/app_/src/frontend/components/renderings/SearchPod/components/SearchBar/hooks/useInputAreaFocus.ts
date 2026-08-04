import { RefObject, useEffect, useRef } from 'react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';

export interface IUseInputAreaFocusProps {
    isDropdownSelected: boolean;
    isUserInteractingWithInput: boolean;
    reset: () => void;
    interactableFieldRef?: RefObject<HTMLDivElement | null>;
}

const useInputAreaFocus = ({
    reset,
    interactableFieldRef,
    isUserInteractingWithInput,
    isDropdownSelected,
}: IUseInputAreaFocusProps): void => {
    const isMobile = useMobileViewport();
    // ref is required because of closures in event listeners
    const isUserInteractingWithInputRef = useRef(false);
    const isToDropdownSelectedRef = useRef(isDropdownSelected);

    useEffect(() => {
        isUserInteractingWithInputRef.current = isUserInteractingWithInput;
    }, [isUserInteractingWithInput]);

    useEffect(() => {
        isToDropdownSelectedRef.current = isDropdownSelected;
    }, [isDropdownSelected]);

    useEffect(() => {
        const listener = (event: MouseEvent): void => {
            if (
                !interactableFieldRef?.current?.contains(event.target as Node) &&
                isUserInteractingWithInputRef.current
            ) {
                reset();
            }
        };

        !isMobile && document.addEventListener('mousedown', listener);
        !isMobile && document.addEventListener('keyup', listener);

        return () => {
            !isMobile && document.removeEventListener('mousedown', listener);
            !isMobile && document.removeEventListener('keyup', listener);
            reset();
        };
        // Add isMobile to the deps array, so that the event listeners are removed when the viewport changes from mobile to desktop and vice versa
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile]);
};

export default useInputAreaFocus;
