import React, { FC, useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import offersService from 'frontend/services/offers.service';
import {
    buildRequestedPriceUrl,
    getRequestedPriceAmountText,
    getRequestedPriceDictionary,
    getRequestedPriceValues,
    isRequestedPriceInputValid,
} from 'frontend/utils/livePrice.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { IRequestedPrice } from 'models/data/IRequestedPrice';
import { IRequestedPriceFields } from 'models/data/IRequestedPriceFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { JSSImage } from 'frontend/components/common/JSSImage';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RouterLink from 'frontend/components/common/RouterLink';

export interface IDealsPromoTileFields extends IRequestedPriceFields {
    Image: ISitecoreField<ISitecoreImage>;
    Link: ISitecoreField<ISitecoreLink>;
    Title: ISitecoreField<string>;
}

export interface IDealsPromoTileProps {
    fields: IDealsPromoTileFields;
    setIsTouristTaxDisplayed: React.Dispatch<React.SetStateAction<boolean>>;
    onItemLinkClick?: (url: string, priceText?: string) => void;
}

export const DealsPromoTile: FC<IDealsPromoTileProps> = ({ fields, onItemLinkClick, setIsTouristTaxDisplayed }) => {
    const { isEditMode, sitePath, formatMoney } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
        sitePath: stores.layoutStore.sitePath,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const [isPriceShown, setIsPriceShown] = useState(false);

    const [reqPrice, setReqPrice] = useState<IRequestedPrice | null>(null);
    const priceMathFunction = fields?.PriceMathFunction?.fields?.Code?.value;
    const isPricePP = fields?.IsRequestedPricePP?.value;
    const isRequestedPriceEnabled = fields?.IsRequestedPriceEnabled?.value;
    const priceAmountText =
        isPriceShown && reqPrice
            ? getRequestedPriceAmountText(reqPrice, priceMathFunction, isPricePP, amount =>
                  formatMoney(amount, { currency: reqPrice.currency, maximumFractionDigits: 0 }),
              )
            : '';

    const url =
        (isRequestedPriceEnabled && buildRequestedPriceUrl(fields?.RequestedSearch?.Url, fields?.SortOrder)) ||
        buildSitecoreLinkFullUrl(fields?.Link, sitePath);

    useEffect(() => {
        let isMounted = true;

        const loadRequestedPrice = async (): Promise<void> => {
            const searchName = fields?.RequestedSearch?.Name;

            if (!searchName) return;

            try {
                const key = `${searchName}.${searchName}`;
                const isRounded = fields.IsRequestedPriceRounded?.value ?? true;
                const prices = await offersService.getRequestedPrice([key], isRounded);

                if (isMounted) {
                    const reqPrice = prices?.length ? prices[0] : null;
                    setReqPrice(reqPrice);

                    const reqPriceValues = getRequestedPriceValues(reqPrice, priceMathFunction);

                    if (!isRequestedPriceInputValid(reqPriceValues, isPricePP)) {
                        return;
                    }

                    setIsTouristTaxDisplayed(true);
                    setIsPriceShown(true);
                }
            } catch (e) {}
        };

        if (!isEditMode && isRequestedPriceEnabled) {
            loadRequestedPrice();
        }

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, fields]);

    if (!fields) {
        return null;
    }

    if (isEditMode) {
        return (
            <div className='tile-block tile-block--exp-editor'>
                <div className='exp-editor-bg-image'>
                    <JSSImage field={fields.Image} />
                </div>
                <div className='tile-block__info'>
                    <Text field={fields.Title} tag='h3' className='tile-block-info__title' />
                    <RouterLink link={fields.Link}>{fields.Link.value?.text}</RouterLink>
                </div>
            </div>
        );
    }

    return (
        <div className='tile-block'>
            <JSSImageNext field={fields.Image} mediaSize={{ desktop: MediaSize.Medium }} fill />
            <div className='tile-block__info'>
                <h3 className='tile-block-info__title'>
                    {url ? (
                        <RouterLink
                            link={{ value: { href: url, text: '', linktype: SitecoreLinkType.Internal } }}
                            className='link-pseudo-overlay'
                            onClick={() => onItemLinkClick?.(url, priceAmountText)}
                        >
                            {fields.Title?.value}
                        </RouterLink>
                    ) : (
                        fields.Title?.value
                    )}
                </h3>
                {isPriceShown && !!priceAmountText && (
                    <PriceLabel
                        className='tile-block-info__price'
                        tag='div'
                        price={<span className='price'>{priceAmountText}</span>}
                        priceDictionary={getRequestedPriceDictionary(priceMathFunction, isPricePP)}
                        wrapLabelBeforePrice={label => <div className='price-prefix'>{label}</div>}
                        wrapLabelAfterPrice={label => <span className='price-suffix'>{label}</span>}
                    />
                )}
            </div>
        </div>
    );
};

export default observer(DealsPromoTile);
