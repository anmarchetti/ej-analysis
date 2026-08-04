import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getLivePriceCriteriaOfPromoBlocks, setLivePricesToPromoBlocks } from 'frontend/utils/livePrice.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IPromoBlockFields, IPromoBlocksGlobalFields } from 'models/data/IPromoBlockFields';
import { TitleFontStyle } from 'models/enum/CustomisableComponentsParameters';
import { BigVariantPillAlignment, BigVariantTitlePlacementOptions } from 'models/enum/PromoBlocksBigVariantParams';
import { IconTextCarouselIconAlignment } from 'models/enum/PromoBlocksIconTextCarouselVariantParams';
import { PromoBlockTitleColorOption, TitleFontSizeMobileAndDesktopPromoBlocks } from 'models/enum/PromoBlocksParams';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';

import PromoBlocksRenderHelper from './components/PromoBlocksRenderHelper/PromoBlocksRenderHelper';
import PromoBlocksTitle from './components/PromoBlocksTitle/PromoBlocksTitle';
import { isPromoBlockEmpty } from './PromoBlocks.utils';

import styles from './PromoBlocks.module.scss';

interface IBigVariantPromoBlocksParams {
    PillAlignment?: BigVariantPillAlignment;
    TitlePlacement?: BigVariantTitlePlacementOptions;
}

interface IIconTextCarouselVariantPromoBlocksParams {
    AddBackgroundShadow?: TSitecoreCheckboxValue;
    IconAlignment?: IconTextCarouselIconAlignment;
}

export interface IPromoBlocksParams extends IBigVariantPromoBlocksParams, IIconTextCarouselVariantPromoBlocksParams {
    HasImageDarkOverlay?: TSitecoreCheckboxValue;
    IsButtonOutlined?: TSitecoreCheckboxValue;
    IsLivePriceEnabled?: TSitecoreCheckboxValue;
    IsMultiRow?: TSitecoreCheckboxValue;
    ShowShard?: TSitecoreCheckboxValue;
    Theme?: PromoBlocksThemes;
    TitleColor?: PromoBlockTitleColorOption;
    TitleFontSize?: TitleFontSizeMobileAndDesktopPromoBlocks;
    TitleFontStyle?: TitleFontStyle;
}

export interface IPromoBlocksProps
    extends ISitecoreComponent<IPromoBlocksGlobalFields, IPromoBlocksParams>,
        IComponentWithRerenderProps {
    isUsedAsComponent?: boolean;
    onClickItem?: (item: IPromoBlockFields) => void;
}

export const PromoBlocks: FunctionComponent<IPromoBlocksProps> = ({
    fields,
    params,
    rendering,
    isUsedAsComponent,
    onClickItem,
}) => {
    const {
        pageName,
        isEditMode,
        isLivePriceEnabled,
        getLivePrice,
        isMosaicComponentLivePriceEnabled,
        getLivePriceCodesByCriteria,
        isNumberOfNightsLabelsEnabled,
    } = useStore((stores: TStores) => ({
        pageName: stores.layoutStore.pageName,
        isEditMode: stores.layoutStore.isEditMode,
        isLivePriceEnabled: stores.layoutStore.isLivePriceEnabled,
        isNumberOfNightsLabelsEnabled: stores.layoutStore.isNumberOfNightsLabelsEnabled,
        getLivePrice: stores.hotelsStore.getLivePrice,
        isMosaicComponentLivePriceEnabled: stores.layoutStore.isMosaicComponentLivePriceEnabled,
        getLivePriceCodesByCriteria: stores.hotelsStore.getLivePriceCodesByCriteria,
    }));

    const [isMounted, setIsMounted] = useState(false);
    const [items, setItems] = useState<IPromoBlockFields[]>(fields?.Children || []);

    const theme = params?.Theme;
    const isMosaicTheme = theme === PromoBlocksThemes.Mosaic;
    const isLivePrice = isMosaicTheme
        ? isMosaicComponentLivePriceEnabled
        : !!params?.IsLivePriceEnabled && isLivePriceEnabled;

    const loadPrices = async (itemsWithoutPrice?: IPromoBlockFields[]): Promise<void> => {
        if (isEditMode || !isLivePrice || !isMounted) return;

        const criteriaList = getLivePriceCriteriaOfPromoBlocks(itemsWithoutPrice || items);
        const livePriceCodes = await getLivePriceCodesByCriteria(criteriaList);
        const prices = await getLivePrice(livePriceCodes);

        if (prices.length) {
            const itemsWithPrices = setLivePricesToPromoBlocks(itemsWithoutPrice || items, prices);
            setItems(itemsWithPrices);
        }
    };

    useEffect(() => {
        setIsMounted(true);

        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        setItems(fields?.Children || []);
        loadPrices(fields?.Children || []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields?.Children, pageName]);

    useEffect(() => {
        loadPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted]);

    const handleClickItem = useCallback(
        (item: IPromoBlockFields) => {
            if (isUsedAsComponent) {
                onClickItem?.(item);
            }
        },
        [onClickItem, isUsedAsComponent],
    );

    // Don't render if no fields or all items are empty
    if (!fields || (!isEditMode && items.every(isPromoBlockEmpty))) {
        return null;
    }

    const themeName = theme?.replaceAll(/ - | /g, '-')?.toLowerCase() || '';
    const formattedItems = items.map(item => {
        const { LinkedDestination, Title } = item.fields;
        const linkedDestinationName = LinkedDestination?.[0]?.fields?.Name?.value;

        const formattedTitle = linkedDestinationName
            ? Tokenizer.replaceTokens(Title.value, {
                  [Tokens.Destination]: linkedDestinationName,
              })
            : Title.value;

        return {
            ...item,
            fields: { ...item.fields, Title: { value: formattedTitle } },
        };
    });

    return (
        <div data-tid={`promo-block-wrapper-${themeName}`} className={styles.wrapper}>
            <PromoBlocksTitle theme={theme} rendering={rendering} />
            <PromoBlocksRenderHelper
                shouldTrackAsPromoBlocks={!isUsedAsComponent}
                items={formattedItems}
                params={params}
                handleClickItem={handleClickItem}
                displayNumberOfNights={isNumberOfNightsLabelsEnabled && !!fields?.EnableNumberOfNights?.value}
                Link={fields?.Link}
                isTouristTaxTooltipShown={fields?.EnableTouristTaxGenericTooltip?.value}
                uid={rendering?.uid}
            />
        </div>
    );
};

export default observer(PromoBlocks);
