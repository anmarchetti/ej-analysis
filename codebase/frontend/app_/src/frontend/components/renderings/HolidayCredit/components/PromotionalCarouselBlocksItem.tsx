import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

interface IPromotionalCarouselBlocksItem {
    item: IPromoBlockFields;
}

export const PromotionalCarouselBlocksItem = observer((props: IPromotionalCarouselBlocksItem) => {
    const { formatMoney } = useStore(stores => ({
        formatMoney: stores.marketStore.formatMoney,
    }));

    const getBackgroundImage = () => {
        const src = props.item.fields?.Image?.value?.src;

        return src ? `url(${cmsUrls.media(src, getMediaSizeParams(MediaSize.Medium))})` : '';
    };

    const hasLink = !!props.item.fields?.Link?.value?.href;
    const hasTitle = !!props.item.fields?.Title?.value?.trim();
    const pricePP = props.item.livePrice?.pricePP || 0;
    const hasPrice = pricePP > 0;

    return (
        <div key={props.item.id} className='promo-block-card'>
            <div className='background' style={{ backgroundImage: getBackgroundImage() }}>
                {hasLink && (
                    <RouterLink link={props.item.fields.Link} className='promotional-carousel-link'>
                        <div className='d-flex justify-content-between align-items-center'>
                            {hasTitle && (
                                <Text
                                    field={props.item.fields.Title}
                                    tag='span'
                                    className='promotional-carousel-title'
                                />
                            )}
                            {!hasPrice && <SvgChevronRight className='icon-arrow' />}
                        </div>
                        {hasPrice && (
                            <PriceLabel
                                tag='div'
                                className='promo-slide__item__price'
                                priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}
                                price={
                                    <span className='price'>
                                        {formatMoney(Number(pricePP), {
                                            currency: props.item.livePrice?.currency,
                                            maximumFractionDigits: 0,
                                        })}
                                    </span>
                                }
                                wrapLabelBeforePrice={label => <span className='price-prefix'>{label}</span>}
                                wrapLabelAfterPrice={label => <span className='price-suffix'>{label}</span>}
                                chevronIcon={<SvgChevronRight className='icon-arrow' />}
                            />
                        )}
                    </RouterLink>
                )}
            </div>
        </div>
    );
});

export default PromotionalCarouselBlocksItem;
