import React, { FC } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { useMobileViewport, useTabletViewport } from 'frontend/hooks/useMediaQuery';
import { getPaddingSizeClassName } from 'frontend/utils/componentStylesCustomisation.utils';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ContainerPaddingOptions, TextPosition } from 'models/enum/CustomisableComponentsParameters';
import { InformationTilesTheme } from 'models/enum/InformationTilesTheme';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';

import InformationTilesItem, { IInformationTilesItemFields } from './components/InformationTilesItem';

import styles from './InformationTiles.module.scss';

export interface IInformationTilesFields {
    Children: ISitecoreChildren<IInformationTilesItemFields>[];
    Title?: ISitecoreField<string>;
}

interface IInformationTilesParams {
    IsTitleUnderIcon?: TSitecoreCheckboxValue;
    PaddingSize?: ContainerPaddingOptions;
    TextAlign?: TextPosition;
    Theme?: InformationTilesTheme;
}

export interface IInformationTilesProps extends ISitecoreComponent<IInformationTilesFields, IInformationTilesParams> {
    isDefaultTheme?: boolean;
    isUsedAsComponent?: boolean;
}

const DESKTOP_ITEMS_AMOUNT = 4;
const TABLET_ITEMS_AMOUNT = 3;

const CAROUSEL_ICON_SIZE = 33;

export const InformationTiles: FC<IInformationTilesProps> = props => {
    const { Theme, TextAlign, IsTitleUnderIcon, PaddingSize } = props.params || {};
    const paddingSizeValue = PaddingSize || ContainerPaddingOptions.Padding24;
    const items = props.fields?.Children || [];
    const isTransparentVariant = Theme === InformationTilesTheme.TransparentCarouselVariant;

    const isMobile = useMobileViewport();
    const isTablet = useTabletViewport();
    const isSmallScreen = isMobile || isTablet;
    const shouldRenderOtherThemeCarousel =
        items.length > DESKTOP_ITEMS_AMOUNT || isMobile || (isTablet && isTransparentVariant);
    const tilesClassName: string = classNames(
        'information-tiles',
        'information-tiles--carousel',
        styles.tilesContainer,
        {
            'information-tiles--page': Theme === InformationTilesTheme.PageVariant,
            'information-tiles--center': TextAlign === TextPosition.Center,
            'information--centered': items.length < DESKTOP_ITEMS_AMOUNT && !isMobile && props.isDefaultTheme,
            'information-tiles--transparent': isTransparentVariant,
            [styles.noMargin]: !props.isUsedAsComponent,
            [styles.carouselContainer]: shouldRenderOtherThemeCarousel,
        },
    );

    if (!items.length) {
        return null;
    }

    const responsive: ResponsiveType = {
        desktop: {
            breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 },
            items: Math.min(items.length, DESKTOP_ITEMS_AMOUNT),
        },
        tablet: {
            breakpoint: { max: 1024, min: 768 },
            partialVisibilityGutter: 30,
            items: Math.min(items.length, TABLET_ITEMS_AMOUNT),
        },
        mobile: {
            breakpoint: { max: 767, min: 0 },
            partialVisibilityGutter: 30,
            items: 1,
        },
    };

    const renderItems = (iconSize?: number): React.JSX.Element[] => {
        const isTitleUnderIcon = isSitecoreCheckboxSelected(IsTitleUnderIcon);

        return items.map(el => (
            <InformationTilesItem
                key={el.id}
                {...el}
                isTitleUnderIcon={isTitleUnderIcon}
                isDefaultTheme={props.isDefaultTheme}
                iconSize={iconSize}
                className={classNames(styles.tile, {
                    [styles.carouselItem]:
                        !props.isUsedAsComponent &&
                        isTransparentVariant &&
                        !isSmallScreen &&
                        shouldRenderOtherThemeCarousel,
                    [styles.defaultCarouselItem]: shouldRenderOtherThemeCarousel,
                })}
            />
        ));
    };

    const defaultTheme = (
        <>
            {items.length > DESKTOP_ITEMS_AMOUNT || isMobile ? (
                <CarouselWrapper
                    centerMode={false}
                    className={tilesClassName}
                    infinite
                    responsive={responsive}
                    showDots={isMobile}
                    partialVisible={isMobile}
                    arrows={!isMobile}
                >
                    {renderItems(CAROUSEL_ICON_SIZE)}
                </CarouselWrapper>
            ) : (
                <div className={tilesClassName}>{renderItems()}</div>
            )}
        </>
    );

    const otherTheme = (
        <>
            {isTransparentVariant && (
                <Text
                    tag='h3'
                    field={props?.fields?.Title}
                    className={classNames('information-tiles--title', {
                        [styles.noMarginTop]: !props.isUsedAsComponent,
                    })}
                />
            )}
            {shouldRenderOtherThemeCarousel ? (
                <CarouselWrapper
                    centerMode={false}
                    className={tilesClassName}
                    infinite
                    responsive={responsive}
                    showDots={isSmallScreen}
                    arrows={!isSmallScreen || !isTransparentVariant}
                    partialVisible={isSmallScreen && isTransparentVariant}
                >
                    {renderItems(CAROUSEL_ICON_SIZE)}
                </CarouselWrapper>
            ) : (
                <div className={tilesClassName}>{renderItems()}</div>
            )}
        </>
    );

    if (props.isUsedAsComponent) {
        return props.isDefaultTheme ? defaultTheme : otherTheme;
    }

    return <div className={classNames(getPaddingSizeClassName(paddingSizeValue))}>{otherTheme}</div>;
};

export default InformationTiles;
