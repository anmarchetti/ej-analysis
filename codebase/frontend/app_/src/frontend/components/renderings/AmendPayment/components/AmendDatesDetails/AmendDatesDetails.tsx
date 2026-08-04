import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import HolidaySummary from 'frontend/components/common/HolidaySummary/HolidaySummary';

interface IAmendDatesDetailsProps {
    fields: ILuggageInfoFields & ICabinBagsInfoFields;
}

const AmendDatesDetails: FunctionComponent<IAmendDatesDetailsProps> = ({ fields }) => {
    const { booking, offer, offerWithPrices } = useStore((stores: IHolidaysStores) => ({
        offer: stores.amendDatesStore.offer,
        offerWithPrices: stores.amendDatesStore.offerWithPrices,
        booking: stores.amendDatesStore.booking,
    }));

    if (!booking || !offer) {
        return null;
    }

    return (
        <HolidaySummary
            dataTidPrefix='amend-payment'
            booking={booking}
            flights={offer.transport}
            transfer={offer.transfers[0]}
            accom={offer.accom}
            luggageInfo={offerWithPrices?.offer.extraLuggageInfo}
            selectedSeats={offer.seatSelection}
            luggageInfoFields={fields}
            cabinBagsInfoFields={fields}
        />
    );
};

export default observer(AmendDatesDetails);
