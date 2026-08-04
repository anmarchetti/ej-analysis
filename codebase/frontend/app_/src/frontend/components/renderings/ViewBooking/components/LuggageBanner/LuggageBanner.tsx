import React from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';

import styles from './LuggageBanner.module.scss';

interface ILuggageBannerProps {
    LuggageDisabledCTA?: ISitecoreField<ISitecoreLink>;
    LuggageDisabledDescription?: ISitecoreField<string>;
    LuggageDisabledHeader?: ISitecoreField<string>;
    LuggageInternalDescription?: ISitecoreField<string>;
    LuggageInternalHeader?: ISitecoreField<string>;
}

const LuggageBanner = ({
    LuggageDisabledCTA,
    LuggageDisabledDescription,
    LuggageDisabledHeader,
    LuggageInternalDescription,
    LuggageInternalHeader,
}: ILuggageBannerProps) => {
    const { isConfirmationPage, isFlightExternal, isExtraLuggageEnabled } = useStore((stores: TStores) => ({
        isFlightExternal: stores.viewBookingStore.isFlightExternal,
        isExtraLuggageEnabled: stores.layoutStore.isExtraLuggageEnabled,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
    }));

    let header, description;

    if (!isFlightExternal) {
        header = LuggageInternalHeader;
        description = LuggageInternalDescription;
    } else {
        header = LuggageDisabledHeader;
        description = LuggageDisabledDescription;
    }

    return (
        <>
            {!isConfirmationPage && (!isFlightExternal || !isExtraLuggageEnabled) && (
                <InfoBlock
                    title={header}
                    text={description}
                    link={LuggageDisabledCTA}
                    className={styles.luggageBanner}
                />
            )}
        </>
    );
};

export default LuggageBanner;
