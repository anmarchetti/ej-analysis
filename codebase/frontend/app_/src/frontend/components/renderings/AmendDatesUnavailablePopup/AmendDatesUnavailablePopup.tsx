import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import UnavailableFlowPopup from 'frontend/components/common/UnavailableFlowPopup/UnavailableFlowPopup';

const AmendDatesUnavailablePopup: FC<ISitecoreComponent<IUnavailablePopupFields>> = ({ fields }) => {
    const {
        isNoAmendDatesAvailability,
        isAmendDatesError,
        clearAmendDatesStore,
        setIsNoAvailableDates,
        isManageHolidayPopupOpened,
    } = useStore((stores: IHolidaysStores) => ({
        isNoAmendDatesAvailability: stores.amendDatesStore.isNoAvailableDates,
        setIsNoAvailableDates: stores.amendDatesStore.setIsNoAvailableDates,
        clearAmendDatesStore: stores.amendDatesStore.clearStore,
        isAmendDatesError: stores.amendDatesStore.isError,
        isManageHolidayPopupOpened: stores.viewBookingStore.isManageHolidayPopupOpened,
    }));

    const isAmendDatesErrorPopupShown = isNoAmendDatesAvailability || isAmendDatesError;

    if (!fields || !isAmendDatesErrorPopupShown) {
        return null;
    }

    const onCloseDatesPopup = () => {
        clearAmendDatesStore();
        setIsNoAvailableDates(false);
    };

    return (
        <UnavailableFlowPopup
            onClose={onCloseDatesPopup}
            fields={fields}
            // Temp decision before the correct Popup will be build
            isInnerPopup={isManageHolidayPopupOpened}
        />
    );
};

export default observer(AmendDatesUnavailablePopup);
