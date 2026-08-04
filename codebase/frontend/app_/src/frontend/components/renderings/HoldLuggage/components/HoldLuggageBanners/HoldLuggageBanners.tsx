import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';

import styles from './HoldLuggageBanners.module.scss';

export interface IHoldLuggageBannersProps {
    internalFlightDescription: ISitecoreField<string>;
    internalFlightHeader: ISitecoreField<string>;
    requestFailureDescription: ISitecoreField<string>;
    requestFailureHeader: ISitecoreField<string>;
    unavailableMessageDescription: ISitecoreField<string>;
    unavailableMessageHeader: ISitecoreField<string>;
}

const HoldLuggageBanners: FC<IHoldLuggageBannersProps> = ({
    requestFailureDescription,
    requestFailureHeader,
    unavailableMessageDescription,
    internalFlightDescription,
    unavailableMessageHeader,
    internalFlightHeader,
}) => {
    const { isExtraLuggageEnabled, extraLuggageCategoriesExist, isFlightExtrasFailed, isFlightExternal } = useStore(
        (stores: TStores) => ({
            isFlightExtrasFailed: stores.bookingStore.isFlightExtrasFailed,
            extraLuggageCategoriesExist: stores.bookingStore.extraLuggageCategoriesExist,
            isFlightExternal: stores.bookingStore.isFlightExternal || stores.viewBookingStore.isFlightExternal,
            isExtraLuggageEnabled: stores.layoutStore.isExtraLuggageEnabled,
        }),
    );

    if (!isExtraLuggageEnabled) {
        return (
            <InfoBlock
                text={unavailableMessageDescription}
                title={unavailableMessageHeader}
                className={styles.failureBanner}
                dataTid='hold-luggage-disable'
            />
        );
    }

    if (!isFlightExternal) {
        return (
            <InfoBlock
                text={internalFlightDescription}
                title={internalFlightHeader}
                className={styles.failureBanner}
                dataTid='banner-internal'
            />
        );
    }

    if (isFlightExtrasFailed || !extraLuggageCategoriesExist) {
        return (
            <InfoBlock
                text={requestFailureDescription}
                title={requestFailureHeader}
                withWarningIcon
                className={styles.failureBanner}
                dataTid='banner-disabled'
            />
        );
    }

    return null;
};

export default observer(HoldLuggageBanners);
