import React, { FunctionComponent, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { logger } from 'frontend/services/logging';
import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgCopy from 'frontend/components/icons-new/Copy';

const DEFAULT_TIME = 2000;

interface IPromoMerchBannerFields {
    CopiedConfirmation: ISitecoreField<string>;
    CopiedMessageShowingTime: ISitecoreField<number>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Link: ISitecoreField<ISitecoreLink>;
    PromoCode: ISitecoreField<string>;
    TermsAndConditions: ISitecoreField<string>;
    TextBeforePromoCode: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

type TPromoMerchBannerProps = ISitecoreComponent<IPromoMerchBannerFields>;

const ICON_SIZES = {
    desktop: {
        width: 45,
        height: 26,
    },
    mobile: {
        width: 55,
        height: 33,
    },
};

export const PromoMerchBanner: FunctionComponent<TPromoMerchBannerProps> = ({ fields }) => {
    const {
        isScreenMedium,
        getPhrase,
        trackEventWithParams,
        isDealsHubPage,
        isHolidayTypePage,
        isAllHolidayTypesPage,
        sendCustomEvent,
    } = useStore(stores => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        getPhrase: stores.layoutStore.getPhrase,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        isDealsHubPage: stores.layoutStore.isDealsHubPage,
        isHolidayTypePage: stores.layoutStore.isHolidayTypePage,
        isAllHolidayTypesPage: stores.layoutStore.isAllHolidayTypesPage,
        sendCustomEvent: stores.engageStore.sendCustomEvent,
    }));

    const [isAlertShown, setAlertShown] = useState(false);

    const onCopyClick = async (): Promise<void> => {
        const promoCode = fields?.PromoCode?.value;

        if (!promoCode) return;

        try {
            await copyToClipboard(promoCode);
            setAlertShown(true);
            setTimeout(() => setAlertShown(false), fields?.CopiedMessageShowingTime?.value ?? DEFAULT_TIME);
        } catch (e) {
            logger.error(e);
        }
    };

    if (!fields?.Title?.value) {
        return null;
    }

    const { Title, Description, Link, Icon, PromoCode, TextBeforePromoCode, TermsAndConditions, CopiedConfirmation } =
        fields;

    const alert = !!CopiedConfirmation?.value && (
        <div className='promo-merch-banner__alert' role='alert'>
            <span>{CopiedConfirmation.value}</span>
        </div>
    );

    const trackingDeals = (): void => {
        const title = fields.Title?.value.replaceAll('&pound;', '');
        const description = fields.Description?.value.replaceAll('&pound;', '');
        const link = fields.Link?.value?.text.replaceAll('&pound;', '');

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.CTAClicked,
                eventLabel: EventLabels.PromoBanner,
                eventType: EventTypes.Interaction,
                eventCategory:
                    (isDealsHubPage && EventCategories.Deals) ||
                    (isHolidayTypePage && EventCategories.HolidayTypes) ||
                    (isAllHolidayTypesPage && EventCategories.HolidayTypesHub) ||
                    EventCategories.Empty,
            },
            {
                genericValue1: title,
                genericValue2: description,
                genericValue3: link,
                genericValue4: null,
            },
        );

        sendCustomEvent(EventTypes.PromoBannerInteraction, {
            buttonLabel: link,
            buttonLocation: Link?.value?.href || '',
        });
    };

    return (
        <div className='promo-merch-banner'>
            <div className='promo-merch-banner__wrapper'>
                <div className='promo-merch-banner__col'>
                    {!!Icon?.value && (
                        <JSSImageNext
                            className='promo-merch-banner__icon'
                            field={Icon}
                            mediaSize={MediaSize.Small}
                            dynamicSize={ICON_SIZES}
                        />
                    )}
                    <div>
                        <RichTextWithLinks tag='h3' className='promo-merch-banner__title' field={Title} />
                        {!!Description?.value && (
                            <RichTextWithLinks className='promo-merch-banner__description' field={Description} />
                        )}
                    </div>
                    {isAlertShown && !isScreenMedium && alert}
                </div>
                <div className='promo-merch-banner__col'>
                    {!!PromoCode?.value && (
                        <div className='promo-merch-banner__promo'>
                            {!!TextBeforePromoCode?.value && <Text tag='span' field={TextBeforePromoCode} />}

                            <Text tag='span' className='promo-code' field={PromoCode} />
                            <button
                                type='button'
                                aria-label={getPhrase(SitecoreDictionary.GlobalsButtonsCopy)}
                                onClick={onCopyClick}
                            >
                                <SvgCopy />
                            </button>

                            {isAlertShown && isScreenMedium && alert}
                        </div>
                    )}

                    {Link?.value?.href && (
                        <RouterLink link={Link} className='btn promo-merch-banner__btn' onClick={trackingDeals}>
                            {Link.value.text}
                        </RouterLink>
                    )}
                </div>
            </div>
            {!!TermsAndConditions?.value && (
                <RichTextWithLinks tag='div' className='promo-merch-banner__terms' field={TermsAndConditions} />
            )}
        </div>
    );
};

export default observer(PromoMerchBanner);
