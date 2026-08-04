import { FC } from 'react';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import UnavailableFlowPopup from 'frontend/components/common/UnavailableFlowPopup/UnavailableFlowPopup';

const AmendTransfersUnavailablePopup: FC<ISitecoreComponent<IUnavailablePopupFields>> = ({ fields }) => {
    const {
        isUnavailableTransferPopupShown,
        setIsUnavailableTransferPopupShown,
        booking,
        isFromChangeDate,
        amendDatesOffer,
    } = useStore((stores: IHolidaysStores) => ({
        isUnavailableTransferPopupShown: stores.amendTransfersStore.isUnavailableTransferPopupShown,
        setIsUnavailableTransferPopupShown: stores.amendTransfersStore.setIsUnavailableTransferPopupShown,
        isFromChangeDate: stores.amendTransfersStore.isFromChangeDate,
        amendDatesOffer: stores.amendDatesStore.offer,
        booking: stores.viewBookingStore.booking,
    }));

    if (!fields || !isUnavailableTransferPopupShown || !booking) {
        return null;
    }

    const bookingStartDate = isFromChangeDate ? amendDatesOffer?.accom.date : booking.package?.accom?.startDate;

    return (
        <UnavailableFlowPopup
            onClose={() => setIsUnavailableTransferPopupShown(false)}
            fields={{
                ...fields,
                Description: {
                    value: Tokenizer.replaceToken(
                        fields.Description?.value,
                        Tokens.Date,
                        formatDateL10n(bookingStartDate, DATE_FORMATS.L),
                    ),
                },
            }}
        />
    );
};

export default observer(AmendTransfersUnavailablePopup);
