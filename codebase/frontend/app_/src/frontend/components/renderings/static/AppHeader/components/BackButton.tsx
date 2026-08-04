import React, { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { getSiteUrl } from 'frontend/utils/url.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';
import IconChevronLeft from 'frontend/components/icons-new/ChevronLeft';

import styles from './BackButton.module.scss';

const BackButton: FC = () => {
    const { getPhrase, router, listenToPopState, trackEventWithParams } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        router: stores.routerStore.router,
        listenToPopState: stores.routerStore.listenToPopState,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
    }));

    const handleBackClick = (): void => {
        if (!router) {
            return;
        }

        router.back();

        const unsubscribe = listenToPopState(state => {
            const destinationUrl = getSiteUrl(state.as);
            trackEventWithParams(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.Header,
                    eventAction: EventActions.Navigation,
                    eventLabel: EventLabels.Back,
                    eventType: EventTypes.Interaction,
                },
                generateGenericValues({
                    destinationUrl,
                }),
            );

            unsubscribe();

            return true;
        });
    };

    return (
        <button className={classNames(styles.backButton)} data-tid='back-button' onClick={handleBackClick}>
            <IconChevronLeft className={styles.arrow} />
            {getPhrase(SitecoreDictionary.GlobalsButtonsBack)}
        </button>
    );
};

export default BackButton;
