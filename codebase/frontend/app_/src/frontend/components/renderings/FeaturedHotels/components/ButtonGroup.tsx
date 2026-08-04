import { FC } from 'react';
import { ButtonGroupProps } from 'react-multi-carousel';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

export const ButtonGroup: FC<ButtonGroupProps> = ({ carouselState, next, previous }) => {
    const { getPhrase } = useStore((stores: TStores) => ({ getPhrase: stores.layoutStore.getPhrase }));
    const { currentSlide, totalItems } = carouselState || { currentSlide: 0, totalItems: 0 };

    return (
        <div className='carousel-button-group' data-tid='carousel-button-group'>
            {currentSlide !== 0 && (
                <Button
                    onClick={previous}
                    isText
                    className='arrow--left'
                    data-tid='arrow--left'
                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPreviousButton)}
                >
                    <SvgChevronLeft />
                </Button>
            )}
            {totalItems !== currentSlide + 1 && (
                <Button
                    onClick={next}
                    isText
                    className='arrow--right'
                    data-tid='arrow--right'
                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsNextButton)}
                >
                    <SvgChevronRight />
                </Button>
            )}
        </div>
    );
};
