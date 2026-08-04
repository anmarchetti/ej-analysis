import { FC, useEffect } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import isBackend from 'frontend/utils/isBackend';
import { setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { QueryParamName } from 'models/enum/QueryParamName';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export const SitecorePersonalizeLoader: FC = () => {
    const { layout, engageStore, isBookingConfirmationPage, isHolidays, query } = useStore(stores => ({
        layout: stores.layoutStore.layout,
        engageStore: stores.engageStore,
        isBookingConfirmationPage: stores.routerStore.isBookingConfirmationPage,
        isHolidays: !stores.layoutStore.isTradePortal,
        query: stores.routerStore.router?.query,
    }));

    useEffect(() => {
        const utmMedium = query?.[QueryParamName.UtmMedium];
        const campaignName = query?.[QueryParamName.UtmCampaign];

        if (!isHolidays || !utmMedium || !campaignName) return;

        const sendMarketingEvent = async (): Promise<void> => {
            if (!engageStore.engage) {
                await engageStore.initializeEngage();
            }

            await engageStore.sendMarketingEvent();
        };

        sendMarketingEvent();
    }, [isHolidays, engageStore, query]);

    useEffect(() => {
        if (!isBackend()) {
            engageStore.callEngage();

            if (isHolidays) {
                if (isBookingConfirmationPage() && !engageStore.isOrderCheckoutSent) {
                    engageStore.sendPersonalizeEventsAfterSuccessfulPayment();

                    return;
                }

                if (!isBookingConfirmationPage() && engageStore.isOrderCheckoutSent) {
                    setWebStorageItem(WebStorageKeys.IsOrderCheckoutSent, false, sessionStorage);
                }
            }
        }
    }, [isBookingConfirmationPage, engageStore, layout, isHolidays]);

    return null;
};

export default observer(SitecorePersonalizeLoader);
