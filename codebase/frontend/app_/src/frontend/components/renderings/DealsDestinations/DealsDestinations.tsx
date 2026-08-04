import React, { FC, useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import { TrailingZeroDisplay } from 'code/currency';
import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import offersService from 'frontend/services/offers.service';
import {
    getCustomisableTitleClassName,
    getPaddingSizeClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { ICustomisableComponentParamsWithTitleTag } from 'models/data/ICustomisableComponentParams';
import { IRequestedPrice } from 'models/data/IRequestedPrice';
import { IRequestedSearchFields } from 'models/data/IRequestedSearchFields';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';
import { JSSImageNext, TJSSImageDynamicSize } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';

import DealsDestinationsGroupCard from './components/DealsDestinationsGroupCard/DealsDestinationsGroupCard';
import { IDealsDestinationsCard } from './interfaces';
import { collectCardsTrackingInfo, getCardsRequestedPriceCodes } from './utils';

import styles from './DealsDestinations.module.scss';

interface IDealsDestinationsFields {
    CTAText: ISitecoreField<string>;
    CTAUrl: ISitecoreField<ISitecoreLink>;
    Cards: IDealsDestinationsCard[];
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    IsPriceRounded: ISitecoreField<boolean>;
    RequestedSearch: ISitecoreCompositeField<IRequestedSearchFields>;
    Title: ISitecoreField<string>;
}

export type TDealsDestinationsProps = ISitecoreComponent<
    IDealsDestinationsFields,
    ICustomisableComponentParamsWithTitleTag
>;

const ICON_SIZES: TJSSImageDynamicSize = {
    desktop: {
        width: 50,
        height: 50,
    },
    mobile: {
        width: 40,
        height: 40,
    },
};

export const DealsDestinations: FC<TDealsDestinationsProps> = ({ fields, params, rendering }) => {
    const {
        isEditMode,
        getPhrase,
        trackHolidayTypesHubEvents,
        isHolidayTypePage,
        sitePath,
        isDealsHubPage,
        formatMoney,
        isTouristTaxEnabled,
    } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
        getPhrase: stores.layoutStore.getPhrase,
        trackHolidayTypesHubEvents: stores.trackingStore.trackHolidayTypesHubEvents,
        isHolidayTypePage: stores.layoutStore.isHolidayTypePage,
        sitePath: stores.layoutStore.sitePath,
        isDealsHubPage: stores.layoutStore.isDealsHubPage,
        formatMoney: stores.marketStore.formatMoney,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
    }));

    const prevDataSourceID = usePrevious(rendering.dataSource);
    const [pricesByDestCodes, setPricesByDestCodes] = useState<Map<string, IRequestedPrice>>();
    const [isTouristTaxTooltipDisplayed, setIsTouristTaxTooltipDisplayed] = useState(false);

    const requestedSearchFields = fields?.RequestedSearch?.fields;
    const isRequestedSearchEnabled = !!requestedSearchFields?.Enabled?.value;
    const firstRequestedPrice = Array.from(pricesByDestCodes?.values() || [])[0];
    const requestedSearchUrl = isRequestedSearchEnabled ? firstRequestedPrice?.searchCriteria?.url : undefined;
    const linkField = fields?.CTAUrl?.value?.href
        ? fields.CTAUrl
        : {
              value: {
                  href: requestedSearchUrl,
                  url: requestedSearchUrl,
                  linktype: SitecoreLinkType.External,
                  target: '_blank',
              } as ISitecoreLink,
          };

    useEffect(() => {
        const cards = fields?.Cards || [];

        const loadRequestedPrices = async (): Promise<void> => {
            const priceCodes = getCardsRequestedPriceCodes(cards, requestedSearchFields?.Name?.value);

            if (!priceCodes.length) return;

            try {
                const isRounded = fields?.IsPriceRounded?.value ?? true;
                const prices = await offersService.getRequestedPrice(priceCodes, isRounded);
                const pricesByDestCodes = new Map((prices || []).map(price => [price.geog, price]));
                setPricesByDestCodes(pricesByDestCodes);

                // Track cards and tiles with loaded prices
                if (isHolidayTypePage || isDealsHubPage) {
                    const trackEvents = collectCardsTrackingInfo(cards, pricesByDestCodes, a =>
                        formatMoney(a, {
                            currency: prices[0]?.currency,
                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        }),
                    );
                    trackEvents.forEach(event => trackHolidayTypesHubEvents(EventTypes.ShowDeals, event));
                }
            } catch (e) {
                console.error(e);
            }
        };

        // React uses Object.is() to compare changes.
        // Sometimes it causes redundant api call if fields are the same, but ref changed.
        // So load the prices only if dataSourceID changed (i.e. fields actually changed)
        if (prevDataSourceID !== rendering.dataSource && !isEditMode && isRequestedSearchEnabled) {
            loadRequestedPrices();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields, rendering.dataSource, isEditMode]);

    const isCTAShown = !!linkField.value.href && !!fields?.CTAText?.value;
    const isTouristTaxTooltipShown = isTouristTaxEnabled && isRequestedSearchEnabled && isTouristTaxTooltipDisplayed;

    if (!fields) {
        return null;
    }

    return (
        <div className={classNames('deals-destinations', styles.wrapper, getPaddingSizeClassName(params?.PaddingSize))}>
            <div className={classNames('deals-destinations__header', styles.header)}>
                {!!fields.Icon && (
                    <JSSImageNext field={fields.Icon} className={styles.icon} alt='' dynamicSize={ICON_SIZES} />
                )}
                <div>
                    {!!fields.Title && (
                        <Text
                            className={getCustomisableTitleClassName(styles.title, params)}
                            field={fields.Title}
                            tag={params?.TitleTag || 'h2'}
                        />
                    )}
                    {!!fields.Description && <RichTextWithLinks field={fields.Description} />}
                </div>
            </div>

            {(fields.Cards || []).map(card => (
                <DealsDestinationsGroupCard
                    key={card.id}
                    fields={card.fields}
                    requestedSearchUrl={requestedSearchUrl}
                    pricesByDestCodes={pricesByDestCodes}
                    setIsTouristTaxTooltipDisplayed={setIsTouristTaxTooltipDisplayed}
                />
            ))}

            {(isCTAShown || isTouristTaxTooltipShown) && (
                <div className={classNames('deals-destinations__cta', styles.cta)}>
                    {isTouristTaxTooltipShown && (
                        <TouristTaxGenericTooltip triggerClassName={styles.taxInfo}>
                            <span>{getPhrase(SitecoreDictionary.TouristTaxLabelsPricesIncludeLocalTax)}</span>
                        </TouristTaxGenericTooltip>
                    )}
                    {isCTAShown && (
                        <RouterLink
                            className='btn btn--outlined btn--medium'
                            link={linkField}
                            onClick={(): void => {
                                isHolidayTypePage &&
                                    trackHolidayTypesHubEvents(EventTypes.CTAClick, {
                                        position: 'Middle',
                                        name: fields.CTAText.value,
                                        destination: buildSitecoreLinkFullUrl(linkField, sitePath),
                                    });
                            }}
                        >
                            {fields.CTAText.value}
                        </RouterLink>
                    )}
                </div>
            )}
        </div>
    );
};

export default observer(DealsDestinations);
