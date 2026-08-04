import { RefObject, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { ONE_HUNDRED } from 'code/commonNumbers';

interface IUseSwipeOptions {
    isOn: boolean;
    onTransitionEnd: () => void;
}

interface IUseSwipeData {
    handlers?: {
        onTouchEnd?: () => void;
        onTouchMove?: (e) => void;
        onTouchStart?: (e) => void;
        onTransitionEnd?: () => void;
    };
    onChange?: (data: { [key: string]: boolean | number }) => void;
    ref?: RefObject<HTMLDivElement>;
    swiping?: boolean;
    y?: number;
}

const SWIPE_OFFSET = 30;

const useSwipe = ({ isOn, onTransitionEnd: onEnd }: IUseSwipeOptions): IUseSwipeData => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [{ swiping, y, startY }, setState] = useState({ swiping: false, y: undefined, startY: undefined });

    const onChange = useCallback(
        (data: { [key: string]: boolean | number }) => setState(prevState => ({ ...prevState, ...data })),
        [],
    );

    useLayoutEffect(() => {
        if (!isOn) return;

        requestAnimationFrame(() => onChange({ y: 0 }));
    }, [isOn]);

    if (!isOn) return {};

    return {
        ref: contentRef,
        y,
        swiping,
        onChange,
        handlers: {
            onTouchStart: (e): void => onChange({ swiping: false, y: 0, startY: e.targetTouches[0].clientY }),
            onTouchMove: (e): void => {
                const contentHeight = contentRef.current?.clientHeight;

                if (!contentHeight) return;

                const { clientY } = e.targetTouches[0];
                const from = window.innerHeight - contentHeight;
                const difference = clientY - (startY ?? 0);

                let nextState = {
                    swiping: true,
                    y: difference > 0 ? (difference / contentHeight) * ONE_HUNDRED : 0,
                };

                if (clientY < from) {
                    nextState = { y: 0, swiping: false };
                } else if (clientY >= window.innerHeight - SWIPE_OFFSET) {
                    nextState = { y: 100, swiping: false };
                }

                onChange(nextState);
            },
            onTouchEnd: (): void => {
                const middle = 50;

                let nextState: { swiping: boolean; startY?: number; y?: number } = {
                    swiping: false,
                    startY: undefined,
                };

                if (y! <= middle) {
                    nextState = { ...nextState, y: 0 };
                } else if (y! > middle) {
                    nextState = { ...nextState, y: 100 };
                }

                onChange(nextState);
            },
            onTransitionEnd: (): void => {
                if (y === ONE_HUNDRED) onEnd();
            },
        },
    };
};

export default useSwipe;
