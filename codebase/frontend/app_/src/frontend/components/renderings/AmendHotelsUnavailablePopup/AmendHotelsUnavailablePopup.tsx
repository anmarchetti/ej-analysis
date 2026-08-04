import { FC, useEffect } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import UnavailableFlowPopup from 'frontend/components/common/UnavailableFlowPopup/UnavailableFlowPopup';

import { useAmendHotelUnavailablePopup } from './hooks/useAmendHotelUnavailablePopup';

const AmendHotelsUnavailablePopup: FC<ISitecoreComponent<IUnavailablePopupFields>> = ({ fields }) => {
    const {
        isManageHolidayPopupOpened,
        trackNoAlternativeHotelsTracking,
        isViewBookingPage,
        isAmendHotelSummaryPage,
        validationErrorHotelTracking,
    } = useStore(({ viewBookingStore, trackingStore, layoutStore }: IHolidaysStores) => ({
        isManageHolidayPopupOpened: viewBookingStore.isManageHolidayPopupOpened,
        trackNoAlternativeHotelsTracking: trackingStore.changeHotel.noAlternativeHotelsTracking,
        validationErrorHotelTracking: trackingStore.changeHotel.validationErrorHotelTracking,
        isViewBookingPage: layoutStore.isViewBookingPage,
        isAmendHotelSummaryPage: layoutStore.isAmendHotelSummaryPage,
    }));

    const { onClose, onConfirm, isLoading, isShown } = useAmendHotelUnavailablePopup();

    useEffect(() => {
        if (!isShown) {
            return;
        }

        if (isViewBookingPage) {
            trackNoAlternativeHotelsTracking();
        }

        if (isAmendHotelSummaryPage) {
            validationErrorHotelTracking();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isShown, isViewBookingPage, isAmendHotelSummaryPage]);

    if (!fields || !isShown) {
        return null;
    }

    return (
        <UnavailableFlowPopup
            onClose={onClose}
            onConfirm={onConfirm}
            isLoading={isLoading}
            fields={fields}
            // Temp decision before the correct Popup will be build
            isInnerPopup={isManageHolidayPopupOpened}
        />
    );
};

export default observer(AmendHotelsUnavailablePopup);
