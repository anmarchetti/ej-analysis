import { MutableRefObject, useEffect, useState } from 'react';

export const PADDING_TO_EDGE = 15;

export const useAdjustCopiedLabelPosition = (
    elRef: MutableRefObject<HTMLDivElement | null>,
): {
    checkPosition: () => void;
    isNearLeftEdge: boolean;
    isNearRightEdge: boolean;
} => {
    const [isNearRightEdge, setIsNearRightEdge] = useState(false);
    const [isNearLeftEdge, setIsNearLeftEdge] = useState(false);

    const checkPosition = () => {
        if (elRef.current) {
            const rect = elRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            setIsNearRightEdge(viewportWidth - rect.right <= PADDING_TO_EDGE);
            setIsNearLeftEdge(rect.left <= PADDING_TO_EDGE);
        }
    };

    useEffect(() => {
        window.addEventListener('resize', checkPosition);

        return () => {
            window.removeEventListener('resize', checkPosition);
        };
    });

    return { isNearRightEdge, isNearLeftEdge, checkPosition };
};
