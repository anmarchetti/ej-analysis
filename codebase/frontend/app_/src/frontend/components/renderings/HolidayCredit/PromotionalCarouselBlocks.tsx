import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { getLivePriceCriteriaOfPromoBlocks, setLivePricesToPromoBlocks } from 'frontend/utils/livePrice.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IPromoBlockFields, IPromoBlockProps } from 'models/data/IPromoBlockFields';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import SliderButtonsGroup from 'frontend/components/common/SliderButtonsGroup';

import PromotionalCarouselBlocksItem from './components/PromotionalCarouselBlocksItem';

const responsiveConfig: ResponsiveType = {
    desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 }, items: 1 },
    tablet: { breakpoint: { max: 1024, min: 768 }, items: 1 },
    mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};

export const PromotionalCarouselBlocks = observer((props: ISitecoreComponent<IPromoBlockProps>) => {
    const { isLivePriceEnabled, isEditMode, getLivePrice, getLivePriceCodesByCriteria } = useStore(stores => ({
        isLivePriceEnabled: stores.layoutStore.isLivePriceEnabled,
        isEditMode: stores.layoutStore.isEditMode,
        getLivePrice: stores.hotelsStore.getLivePrice,
        getLivePriceCodesByCriteria: stores.hotelsStore.getLivePriceCodesByCriteria,
    }));
    const [items, setItems] = useState<IPromoBlockFields[]>(props.fields?.items || []);
    const isMounted = useRef(false);

    const loadPrices = async () => {
        if (!isLivePriceEnabled || isEditMode) return;

        const criteriaList = getLivePriceCriteriaOfPromoBlocks(items);
        const livePriceCodes = await getLivePriceCodesByCriteria(criteriaList);
        const prices = await getLivePrice(livePriceCodes);

        if (prices.length && isMounted.current) {
            const itemsWithPrices = setLivePricesToPromoBlocks(items, prices);
            setItems(itemsWithPrices);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        loadPrices();

        return () => {
            isMounted.current = false;
        };
    }, []);

    const formattedItems = useMemo(
        () =>
            items.map(item => {
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
            }),
        [items],
    );

    return (
        <div data-tid='promo-blocks-slider' className='promo-blocks-slider show promotional-carousel-slider'>
            <CarouselWrapper
                responsive={responsiveConfig}
                containerClass='carousel-container promotional-carousel-container'
                arrows={false}
                customButtonGroup={<SliderButtonsGroup />}
                showDots={formattedItems.length > 1}
                infinite
            >
                {formattedItems.map((item: IPromoBlockFields, i) => (
                    <div data-tid='promotional-carousel-block-item' className='slide-wrapper' key={item.id + i}>
                        <PromotionalCarouselBlocksItem key={item.id + i} item={item} />
                    </div>
                ))}
            </CarouselWrapper>
        </div>
    );
});

export default PromotionalCarouselBlocks;
