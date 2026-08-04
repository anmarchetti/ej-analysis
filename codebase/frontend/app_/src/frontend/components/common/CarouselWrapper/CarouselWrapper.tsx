import { Children, forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Carousel, { CarouselProps, StateCallBack } from 'react-multi-carousel';
import classNames from 'classnames';

import { updateFocusableElements } from './CarouselWrapper.utils';

import styles from './CarouselWrapper.module.scss';

export type TCarouselRef = Carousel;

interface IExtendedCarouselProps extends CarouselProps {
    initialSlide?: number;
}

// In the original react-multi-carousel, hidden slides (those currently out of view) have the aria-hidden attribute.
// However, these hidden slides can still contain focusable elements such as buttons, links, and similar interactive components.
// When navigating with a keyboard, these elements can still receive focus even though they are not visible to the user.
// This wrapper addresses the issue by setting tabindex="-1" on all focusable elements within hidden slides.

const CarouselWrapper = forwardRef<TCarouselRef | null, IExtendedCarouselProps>(
    ({ children, afterChange, className, initialSlide = 0, ...restProps }, ref) => {
        const carouselRef = useRef<TCarouselRef | null>(null);

        useImperativeHandle(ref, () => carouselRef.current as TCarouselRef);

        const childrenSignature = useMemo(() => Children.map(children, child => child.key)?.join(','), [children]);

        useEffect(() => {
            setTimeout(() => {
                updateFocusableElements(carouselRef.current);
            }, 0);
        }, [childrenSignature]);

        useEffect(() => {
            carouselRef.current?.goToSlide(initialSlide);
        }, [initialSlide]);

        const handleAfterChange = (previousSlide: number, state: StateCallBack): void => {
            updateFocusableElements(carouselRef.current);
            afterChange?.(previousSlide, state);
        };

        return (
            <Carousel
                {...restProps}
                ref={carouselRef}
                afterChange={handleAfterChange}
                className={classNames(styles.carousel, className)}
            >
                {children}
            </Carousel>
        );
    },
);

export default CarouselWrapper;
