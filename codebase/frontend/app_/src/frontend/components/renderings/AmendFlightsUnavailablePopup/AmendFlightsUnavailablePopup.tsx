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

import { getBookingData } from './AmendFlightsUnavailablePopup.utils';

const AmendFlightsUnavailablePopup: FC<ISitecoreComponent<IUnavailablePopupFields>> = ({ fields }) => {
    const {
        isNoAvailableFlightsPopupShown,
        booking,
        toggleNoAvailableFlightsPopup,
        isFromChangeDate,
        amendDatesOffer,
    } = useStore((stores: IHolidaysStores) => ({
        isNoAvailableFlightsPopupShown: stores.amendFlightsStore.isNoAvailableFlightsPopupShown,
        toggleNoAvailableFlightsPopup: stores.amendFlightsStore.toggleNoAvailableFlightsPopup,
        booking: stores.viewBookingStore.booking,
        isFromChangeDate: stores.amendFlightsStore.isFromChangeDate,
        amendDatesOffer: stores.amendDatesStore.offer,
    }));

    if (!fields || !booking || !isNoAvailableFlightsPopupShown) {
        return null;
    }

    const onFlightsPopupClose = () => {
        toggleNoAvailableFlightsPopup(false);
    };

    const {
        depAirportName = '',
        arrAirportName = '',
        bookingStartDate,
    } = getBookingData(amendDatesOffer, booking, isFromChangeDate);

    return (
        <UnavailableFlowPopup
            fields={{
                ...fields,
                Title: {
                    value: Tokenizer.replaceToken(fields.Title?.value, Tokens.Airport, arrAirportName),
                },
                Description: {
                    value: Tokenizer.replaceTokens(fields.Description?.value, {
                        [Tokens.Date]: formatDateL10n(bookingStartDate, DATE_FORMATS.L),
                        [Tokens.Airport]: depAirportName,
                    }),
                },
            }}
            onClose={onFlightsPopupClose}
        />
    );
};

export default observer(AmendFlightsUnavailablePopup);
