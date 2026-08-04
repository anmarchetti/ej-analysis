import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMoreThenTabletViewport, useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { splitToChunksArray } from 'frontend/utils/chunkArray';
import { getCssModuleClassName, getTitleFontClassName } from 'frontend/utils/componentStylesCustomisation.utils';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlocksMaxItems, PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';
import PromoBlocksCarousel from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksCarousel/PromoBlocksCarousel';
import { PromoBlocksGroup } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksGroup/PromoBlocksGroup';
import { PromoBlocksSingleItem } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksSingleItem/PromoBlocksSingleItem';
import PromoBlocksTrackingWrapper from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';
import { IPromoBlocksProps } from 'frontend/components/renderings/PromoBlocks/PromoBlocks';
import {
    getPromoBlockItemTitleColorClassName,
    getPromoBlockItemTitleFontSizeClassName,
    PROMO_BLOCK_GROUP_THEMES,
    shouldHidePromoBlock,
    type TPromoBlockItemTitleColorClassName,
    type TPromoBlockItemTitleFontSizeClassName,
} from 'frontend/components/renderings/PromoBlocks/PromoBlocks.utils';

import styles from './PromoBlocksRenderHelper.module.scss';

export interface IPromoBlocksRenderHelperProps {
    handleClickItem: (item: IPromoBlockFields) => void;
    items: IPromoBlockFields[];
    params: IPromoBlocksProps['params'];
    shouldTrackAsPromoBlocks: boolean;
    uid: any;
    Link?: ISitecoreField<ISitecoreLink>;
    displayNumberOfNights?: boolean;
    isTouristTaxTooltipShown?: boolean;
}

const PromoBlocksRenderHelper: FC<IPromoBlocksRenderHelperProps> = ({
    items,
    params,
    displayNumberOfNights,
    handleClickItem,
    Link,
    isTouristTaxTooltipShown,
    uid,
    shouldTrackAsPromoBlocks,
}) => {
    const { isTouristTaxEnabled, getPhrase } = useStore((stores: TStores) => ({
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const titleFontStyleClassName = getTitleFontClassName(params.TitleFontStyle) ?? '';
    const titleFontSizeClassName = getPromoBlockItemTitleFontSizeClassName(params.TitleFontSize);
    const titleColorClassName = getPromoBlockItemTitleColorClassName(params.TitleColor);
    const titleClassName = classNames(
        titleFontStyleClassName,
        getCssModuleClassName<TPromoBlockItemTitleFontSizeClassName>(styles, titleFontSizeClassName),
        getCssModuleClassName<TPromoBlockItemTitleColorClassName>(styles, titleColorClassName),
    );

    const isXsViewport = useXSMobileViewport();
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    if (!items.length) {
        return null;
    }

    const theme = params?.Theme;
    const isBigTheme = theme === PromoBlocksThemes.Big;
    const isSmallTheme = theme === PromoBlocksThemes.Small;

    const isSmall = isXsViewport && isSmallTheme;

    const blockFields: IPromoBlockFields[] = isSmall
        ? splitToChunksArray(items, PromoBlocksMaxItems.MobileView)
        : items;
    const isMultiRow = isSitecoreCheckboxSelected(params?.IsMultiRow);
    const shouldShowShard = isSitecoreCheckboxSelected(params?.ShowShard);
    const hasToBeHidden = shouldHidePromoBlock(theme, items.length, isXsViewport, isMoreThenTabletViewport);
    const hideClassName = hasToBeHidden ? 'hide' : 'hide-down-md';
    const isGroupTheme = theme ? PROMO_BLOCK_GROUP_THEMES.includes(theme) : false;
    const withDarkOverlay = isSitecoreCheckboxSelected(params?.HasImageDarkOverlay);

    if (isGroupTheme) {
        return (
            <PromoBlocksTrackingWrapper
                items={items}
                theme={theme}
                uid={uid}
                shouldTrackAsPromoBlocks={shouldTrackAsPromoBlocks}
            >
                <PromoBlocksGroup
                    items={items}
                    Link={Link}
                    handleClickItem={handleClickItem}
                    displayNumberOfNights={displayNumberOfNights}
                    isMultiRow={isMultiRow}
                    params={params}
                    titleClassName={titleClassName}
                />
            </PromoBlocksTrackingWrapper>
        );
    }

    return (
        <PromoBlocksTrackingWrapper
            items={items}
            theme={theme}
            uid={uid}
            shouldTrackAsPromoBlocks={shouldTrackAsPromoBlocks}
        >
            <div className={styles.wrapper}>
                {!isMultiRow && (
                    <PromoBlocksCarousel
                        blockFields={blockFields}
                        handleClickItem={handleClickItem}
                        shouldShowShard={shouldShowShard}
                        theme={theme}
                        withDarkOverlay={withDarkOverlay}
                        titlePlacement={params.TitlePlacement}
                        pillAlignment={params.PillAlignment}
                        titleClassName={titleClassName}
                    />
                )}

                <div
                    className={classNames(
                        'promo-blocks big-blocks-container',
                        isMultiRow ? 'promo-blocks--grid' : hideClassName,
                    )}
                    key='promo-blocks'
                >
                    {items.map(item => (
                        <PromoBlocksSingleItem
                            key={item.id}
                            fields={item}
                            onClick={(): void => handleClickItem(item)}
                            shouldShowShard={shouldShowShard}
                            withDarkOverlay={withDarkOverlay}
                            theme={theme}
                            titlePlacement={params.TitlePlacement}
                            pillAlignment={params.PillAlignment}
                            titleClassName={titleClassName}
                            className={classNames({
                                [styles.bigBlockItem]: isBigTheme,
                                [styles.smallBlockItem]: isSmallTheme,
                            })}
                        />
                    ))}
                </div>
                {isTouristTaxEnabled && isBigTheme && isTouristTaxTooltipShown && (
                    <TouristTaxGenericTooltip triggerClassName={styles.taxInfo}>
                        <span>{getPhrase(SitecoreDictionary.TouristTaxLabelsPricesIncludeLocalTax)}</span>
                    </TouristTaxGenericTooltip>
                )}
            </div>
        </PromoBlocksTrackingWrapper>
    );
};

export default observer(PromoBlocksRenderHelper);
