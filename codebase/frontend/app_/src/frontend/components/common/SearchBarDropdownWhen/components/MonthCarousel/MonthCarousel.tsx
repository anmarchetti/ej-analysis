import { FC, useEffect, useRef, useState } from 'react';
import { ResponsiveType, StateCallBack } from 'react-multi-carousel';
import classNames from 'classnames';

import { TIME_UNITS } from 'code/dates';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { IMonthItem } from 'models/data/IMonthAvailability';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import CarouselButtonsGroup from 'frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import MonthOption from 'frontend/components/common/SearchBarDropdownWhen/components/MonthOption/MonthOption';

import styles from './MonthCarousel.module.scss';

export interface IMonthCarouselProps {
    months: IMonthItem[];
    onMonthChange: (month: IMonthItem) => void;
}

const MONTHS_PER_SLIDE = TIME_UNITS.monthsInYear;

const MonthCarousel: FC<IMonthCarouselProps> = ({ months, onMonthChange }) => {
    const carouselWrapperRef = useRef<HTMLDivElement | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
    const [isKeyboardNav, setIsKeyboardNav] = useState(false);

    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const carouselWrapper = carouselWrapperRef?.current;

        if (!carouselWrapper) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent): void => {
            const keys = [KeyboardKey.Tab, KeyboardKey.ArrowLeft, KeyboardKey.ArrowRight, KeyboardKey.ENTER];

            if (keys.includes(e.code as KeyboardKey)) {
                setIsKeyboardNav(true);
            }
        };

        const handleMouseDown = (): void => {
            setIsKeyboardNav(false);
        };

        carouselWrapper.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleMouseDown);

        return () => {
            carouselWrapper.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    useEffect(() => {
        if (isKeyboardNav) {
            const current = slideRefs.current[currentSlideIndex];

            if (current) {
                const input = current.querySelector(`input:not(:disabled)`) as HTMLInputElement;

                if (input) {
                    input.focus();
                }
            }
        }
    }, [currentSlideIndex, isKeyboardNav]);

    const slidesCount = Math.ceil(months.length / MONTHS_PER_SLIDE);
    const slides = Array.from({ length: slidesCount }, (_, slideIndex) => {
        const isVisible = slideIndex === currentSlideIndex;
        const slideStart = slideIndex * MONTHS_PER_SLIDE;
        const slideEnd = slideStart + MONTHS_PER_SLIDE;
        const monthsForSlide = months.slice(slideStart, slideEnd);

        return (
            <div
                key={slideIndex}
                ref={el => {
                    slideRefs.current[slideIndex] = el;
                }}
                // Apply hiddenSlide only during keyboard navigation to prevent horizontal scroll when navigating between radio buttons
                className={classNames(styles.slide, isKeyboardNav && !isVisible && styles.hiddenSlide)}
                aria-hidden={!isVisible}
            >
                {monthsForSlide.map(month => (
                    <MonthOption
                        key={`${month.year}-${month.monthName}`}
                        isVisible={isVisible}
                        month={month}
                        onMonthChange={onMonthChange}
                    />
                ))}
            </div>
        );
    });

    const handleSlideChange = (_prevSlideIndex, state: StateCallBack): void => {
        setCurrentSlideIndex(state.currentSlide);
    };

    const responsive: ResponsiveType = {
        allScreens: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 0 }, items: 1 },
    };

    return (
        <div ref={carouselWrapperRef} className={styles.monthCarousel}>
            <CarouselWrapper
                responsive={responsive}
                showDots={false}
                renderButtonGroupOutside={true}
                arrows={false}
                customButtonGroup={
                    slides.length > 1 ? (
                        <CarouselButtonsGroup
                            minNumberOfItems={1}
                            prevClassName={styles.prevButton}
                            nextClassName={styles.nextButton}
                        />
                    ) : null
                }
                afterChange={(prevSlideIndex, state): void => handleSlideChange(prevSlideIndex, state)}
                keyBoardControl={false}
                slidesToSlide={1}
                containerClass={styles.sliderContainer}
                itemClass={styles.carouselItem}
            >
                {slides}
            </CarouselWrapper>
        </div>
    );
};

export default MonthCarousel;
