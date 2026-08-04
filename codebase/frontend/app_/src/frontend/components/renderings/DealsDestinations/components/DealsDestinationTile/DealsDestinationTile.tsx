import { FC, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import useStore from 'frontend/hooks/useStore';
import {
    buildRequestedPriceUrl,
    getRequestedPriceDictionary,
    getRequestedPriceValues,
    isRequestedPriceInputValid,
} from 'frontend/utils/livePrice.utils';
import { getRegionsCodesRelatedToVirtual } from 'frontend/utils/search/search.utils';
import { IRequestedPrice } from 'models/data/IRequestedPrice';
import { IHolidayTypesHubEventParams } from 'models/data/tracking/IEventWithParams';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import { IDealsDestinationTileFields } from 'frontend/components/renderings/DealsDestinations/interfaces';
import { getDestTileRequestedPriceText } from 'frontend/components/renderings/DealsDestinations/utils';

import styles from './DealsDestinationTile.module.scss';

export interface IDealsDestinationTileProps {
    fields: IDealsDestinationTileFields;
    parentTitle: string;
    pricesByDestCodes: Map<string, IRequestedPrice> | undefined;
    requestedSearchUrl: string | undefined;
    setIsTouristTaxTooltipDisplayed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DealsDestinationTile: FC<IDealsDestinationTileProps> = ({
    fields,
    pricesByDestCodes,
    requestedSearchUrl,
    parentTitle,
    setIsTouristTaxTooltipDisplayed,
}) => {
    const { trackHolidayTypesHubEvents, isHolidayTypePage, isDealsHubPage, formatMoney } = useStore(stores => ({
        trackHolidayTypesHubEvents: stores.trackingStore.trackHolidayTypesHubEvents,
        isHolidayTypePage: stores.layoutStore.isHolidayTypePage,
        isDealsHubPage: stores.layoutStore.isDealsHubPage,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const [isPriceShown, setIsPriceShown] = useState(false);

    const { PriceMathFunction: PriceMathFunctionField, IsRequestedPricePP, Destination, SortOrder } = fields || {};

    const priceMathFunction = PriceMathFunctionField?.fields?.Code?.value;
    const isPricePP = !!IsRequestedPricePP?.value;
    const dest = Destination?.[0]?.fields;
    const title = dest?.Name?.value || '';
    const isPriceEnabled = fields?.IsRequestedPriceEnabled?.value;

    const priceAmountText = useMemo(() => {
        if (!fields || !pricesByDestCodes) return '';

        return getDestTileRequestedPriceText(fields, pricesByDestCodes, amount =>
            formatMoney(amount, { maximumFractionDigits: 0 }),
        );

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields, pricesByDestCodes]);

    useEffect(() => {
        if (!pricesByDestCodes) return;

        const destCode = dest?.Code?.value;
        const reqPrice = destCode && pricesByDestCodes && isPriceEnabled ? pricesByDestCodes.get(destCode) : null;
        const reqPriceValues = reqPrice && getRequestedPriceValues(reqPrice, priceMathFunction);

        if (!isRequestedPriceInputValid(reqPriceValues, isPricePP)) {
            return;
        }

        if (isPriceEnabled) {
            setIsPriceShown(true);
            setIsTouristTaxTooltipDisplayed(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pricesByDestCodes]);

    // The tile should be clickable only if there is price
    const url = priceAmountText
        ? buildRequestedPriceUrl(
              requestedSearchUrl,
              SortOrder,
              dest?.Code?.value,
              getRegionsCodesRelatedToVirtual(dest),
          )
        : null;

    const onClick = (): void => {
        if ((isHolidayTypePage || isDealsHubPage) && priceAmountText) {
            const params = {
                destinationName: title,
                price: priceAmountText,
                moduleTitle: parentTitle,
                // "sponsored": "Yes" EJH-14562: track when sponsored pill functionality will be added to cities
            } as IHolidayTypesHubEventParams;

            trackHolidayTypesHubEvents(EventTypes.RegionDealsClick, params);
        }
    };
    const renderPrefix = (label: string): JSX.Element => <span className='price-prefix me-1'>{label}</span>;
    const renderSuffix = (label: string): JSX.Element => <span className='price-suffix'>{label}</span>;

    return (
        <div className={classNames('deals-destination-tile', styles.tile)}>
            <h4 className={styles.title} data-tid='deals-destination-tile-title'>
                {url ? (
                    <RouterLink
                        link={{ value: { href: url, text: '', linktype: SitecoreLinkType.Internal } }}
                        className='link-pseudo-overlay'
                        onClick={onClick}
                    >
                        {title}
                    </RouterLink>
                ) : (
                    title
                )}
            </h4>

            {!!priceAmountText && isPriceShown && (
                <div className={styles.footer}>
                    <PriceLabel
                        tag='div'
                        className={classNames('deals-destination-tile__price', styles.price)}
                        price={<span className='price-amount'>{priceAmountText}</span>}
                        priceDictionary={getRequestedPriceDictionary(priceMathFunction, isPricePP)}
                        wrapLabelBeforePrice={renderPrefix}
                        wrapLabelAfterPrice={renderSuffix}
                        chevronIcon={<SvgChevronRight className='ms-1' />}
                    />
                </div>
            )}
        </div>
    );
};

export default observer(DealsDestinationTile);
