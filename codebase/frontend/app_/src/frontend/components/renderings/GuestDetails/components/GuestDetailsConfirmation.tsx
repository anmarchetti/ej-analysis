import React, { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ConfirmationInfo from 'frontend/components/common/ConfirmationInfo/ConfirmationInfo';
import ErrataMessage from 'frontend/components/common/ErrataInfo/ErrataMessage';
import { IGuestPageFields } from 'frontend/components/renderings/GuestDetails/GuestDetails.utils';

export const GuestDetailsConfirmation: FunctionComponent<{ fields: IGuestPageFields | undefined }> = props => {
    const {
        getPhrase,
        isErrataEnabled,
        isFacilityErrataEnabled,
        offer,
        confirmPolicy,
        shouldConfirmPolicy,
        toggleConfirmPolicy,
    } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isErrataEnabled: stores.layoutStore.isErrataEnabled,
        isFacilityErrataEnabled: stores.layoutStore.isFacilityErrataEnabled,
        offer: stores.bookingStore.selectedOffer,
        confirmPolicy: stores.guestDetailsStore.confirmPolicy,
        shouldConfirmPolicy: stores.guestDetailsStore.shouldConfirmPolicy,
        toggleConfirmPolicy: stores.guestDetailsStore.toggleConfirmPolicy,
    }));

    const offerErrata = offer?.errataInfo || [];
    const hasOfferErrata = isErrataEnabled && offerErrata.length > 0;
    const offerErrataFlight = offer?.transport?.errataFlightInfo || [];
    const hasOfferErrataFlight = isErrataEnabled && offerErrataFlight.length > 0;
    const facilityErratas = offer?.hotel?.errataFacilities?.map(item => item.name) || [];
    const hasFacilityErratas = isFacilityErrataEnabled && facilityErratas.length > 0;
    const hasErrata = hasFacilityErratas || hasOfferErrata || hasOfferErrataFlight;

    return (
        <ConfirmationInfo
            importantInformation={props.fields?.ImportantInformation}
            onClick={toggleConfirmPolicy}
            isConfirmPolicyChecked={confirmPolicy}
            isConfirmPolicyValid={!shouldConfirmPolicy}
            checkboxLabel={getPhrase(
                hasErrata
                    ? SitecoreDictionary.GuestDetailsCheckboxesConfirmationWithErrata
                    : SitecoreDictionary.GuestDetailsCheckboxesConfirmation,
            )}
            containerClassName='section-container'
        >
            {hasErrata && (
                <ErrataMessage
                    errataInfo={offerErrata}
                    flightErratas={offerErrataFlight}
                    facilityErratas={facilityErratas}
                />
            )}
        </ConfirmationInfo>
    );
};

export default observer(GuestDetailsConfirmation);
