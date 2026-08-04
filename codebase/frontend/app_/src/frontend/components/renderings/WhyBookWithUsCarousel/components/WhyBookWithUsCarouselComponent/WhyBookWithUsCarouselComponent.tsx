import * as React from 'react';
import { useMemo } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import { Tooltip } from 'react-tooltip';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { TextPosition } from 'models/enum/CustomisableComponentsParameters';
import { InformationTilesTheme } from 'models/enum/InformationTilesTheme';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import { IInformationTilesFields } from 'frontend/components/renderings/InformationTiles/InformationTiles';
import WhyBookWithUsCarouselItem from 'frontend/components/renderings/WhyBookWithUsCarousel/components/WhyBookWithUsCarouselItem/WhyBookWithUsCarouselItem';
import styles from 'frontend/components/renderings/WhyBookWithUsCarousel/WhyBookWithUsCarousel.module.scss';

interface IConfidenceCarouselABParams {
    TextAlign?: TextPosition;
    Theme?: InformationTilesTheme;
}

const DESKTOP_ITEMS_AMOUNT = 5;
const TABLET_ITEMS_AMOUNT = 3;

export type TConfidenceCarouselABProps = ISitecoreComponent<IInformationTilesFields, IConfidenceCarouselABParams>;

const WhyBookWithUsCarouselComponent = ({ fields }: TConfidenceCarouselABProps) => {
    const { isScreenMedium } = useStore((stores: TStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
    }));
    const items = fields?.Children || [];
    const renderItems = useMemo(() => {
        if (fields?.Children) {
            return fields.Children.map(el => (
                <WhyBookWithUsCarouselItem key={el.id} {...el} id={el.id} data-tid={'carousel-item'} />
            ));
        }

        return null;
    }, [fields?.Children]);

    if (!renderItems) {
        return null;
    }

    const responsive: ResponsiveType = {
        desktop: {
            breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 },
            items: 5,
        },
        tablet: {
            breakpoint: { max: 1024, min: 768 },
            partialVisibilityGutter: 30,
            items: items.length > TABLET_ITEMS_AMOUNT ? TABLET_ITEMS_AMOUNT : items.length,
        },
        mobile: {
            breakpoint: { max: 767, min: 0 },
            partialVisibilityGutter: 70,
            items: 1,
        },
    };

    const isShowCarouselOnDesktop = items.length > DESKTOP_ITEMS_AMOUNT || !isScreenMedium;

    return (
        <>
            {isScreenMedium && (
                <Tooltip
                    id='tooltip'
                    place='bottom'
                    variant='light'
                    className={styles.tooltip}
                    positionStrategy={'absolute'}
                    opacity={1}
                    render={({ content }) => (
                        <div className={styles.tooltipInner} data-tid='tooltip-inner'>
                            {content}
                        </div>
                    )}
                />
            )}

            {isShowCarouselOnDesktop ? (
                <CarouselWrapper
                    data-tid={'desktop-carousel'}
                    centerMode={false}
                    className={styles.carousel}
                    infinite
                    responsive={responsive}
                    showDots={!isScreenMedium}
                    partialVisbile={!isScreenMedium}
                    arrows={isScreenMedium}
                >
                    {renderItems}
                </CarouselWrapper>
            ) : (
                <div data-tid={'mobile-carousel'} className={styles.carousel}>
                    {renderItems}
                </div>
            )}
        </>
    );
};

export default WhyBookWithUsCarouselComponent;
