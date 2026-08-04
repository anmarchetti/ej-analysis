import { RefObject, useEffect } from 'react';

import { FIFTY_MILLISECONDS } from 'code/commonNumbers';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { KeyboardKey } from 'models/enum/KeyboardKey';

const SENSITIVE_KEYBOARD_KEYS = [
    KeyboardKey.ArrowLeft,
    KeyboardKey.ArrowRight,
    KeyboardKey.ArrowUp,
    KeyboardKey.ArrowDown,
];

interface IUseReactDataPickerFocusProps {
    datePickerWrapper: RefObject<HTMLDivElement> | null;
}

const useReactDataPickerFocus = ({ datePickerWrapper }: IUseReactDataPickerFocusProps): void => {
    const isMobile = useMobileViewport();

    useEffect(() => {
        if (isMobile) {
            return;
        }

        const monthContainer = datePickerWrapper?.current?.querySelector('.react-datepicker__month');

        const keyDownHandler = (event: KeyboardEvent): void => {
            setTimeout(() => {
                if (SENSITIVE_KEYBOARD_KEYS.includes(event.key as KeyboardKey)) {
                    const element: Nullable<HTMLElement> = datePickerWrapper?.current?.querySelector(
                        '.react-datepicker__day[tabindex="0"]',
                    );
                    element?.focus();
                }
            }, FIFTY_MILLISECONDS);
        };

        monthContainer?.addEventListener('keydown', keyDownHandler);

        return () => {
            monthContainer?.removeEventListener('keydown', keyDownHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile]);
};

export default useReactDataPickerFocus;
