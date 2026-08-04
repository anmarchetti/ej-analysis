import { Ref, useEffect, useRef } from 'react';

export interface IUseNumberColumnProps {
    digit: number;
}

interface IUseNumberColumnData {
    containerRef: Ref<HTMLDivElement>;
}

const RANGE_LENGTH = 10;

export const RANGE_10_ARRAY = [...Array(RANGE_LENGTH).keys()].reverse();

export const useNumberColumn = ({ digit }: IUseNumberColumnProps): IUseNumberColumnData => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const wrapper = containerRef.current;
        const y = (wrapper?.clientHeight ?? 0) * parseInt(digit.toString(), 10);

        if (wrapper?.firstChild) {
            wrapper.firstChild['style'].transform = `translateY(${y}px)`;
        }
    }, [digit]);

    return {
        containerRef,
    };
};

export default useNumberColumn;
