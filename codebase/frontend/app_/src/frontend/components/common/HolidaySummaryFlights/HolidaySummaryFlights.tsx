import { FunctionComponent } from 'react';

import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { IGuestsAmount } from 'frontend/utils/luggage.utils';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { ITransport } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { IFastTrackInfoFields } from 'frontend/components/common/Booking/FastTrackInfo/FastTrackInfo';
import { getSelectedSeats } from 'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummarySeats/AmendDatesSummarySeats.utils';

import HolidaySummaryFlightsItem from './components/HolidaySummaryFlightsItem/HolidaySummaryFlightsItem';

export interface IHolidaySummaryFlightsProps {
    flights: ITransport;
    guestsAmountByType: IGuestsAmount;
    passengers: IGuestPassenger[];
    cabinBagsInfoFields?: ICabinBagsInfoFields;
    fastTrackInfoFields?: IFastTrackInfoFields;
    isLuxuryPackage?: boolean;
    selectedSeats?: ISelectedSeat[];
}

const HolidaySummaryFlights: FunctionComponent<IHolidaySummaryFlightsProps> = ({
    flights,
    passengers,
    selectedSeats = [],
    cabinBagsInfoFields,
    fastTrackInfoFields,
    guestsAmountByType,
    isLuxuryPackage,
}) => {
    const { outbound, inbound } = getRouteByDirection(flights.routes);
    const { outboundSeats, inboundSeats } = getSelectedSeats(flights.routes, passengers, selectedSeats);

    return (
        <>
            <HolidaySummaryFlightsItem
                flight={outbound as IRoute}
                chosenSeats={outboundSeats}
                cabinBagsInfoFields={cabinBagsInfoFields}
                guestsAmountByType={guestsAmountByType}
                includesFastTrack={isLuxuryPackage}
                fastTrackInfoFields={fastTrackInfoFields}
                dataTid='holiday-summary-flight-items-outbound'
            />
            <HolidaySummaryFlightsItem
                flight={inbound as IRoute}
                chosenSeats={inboundSeats}
                cabinBagsInfoFields={cabinBagsInfoFields}
                guestsAmountByType={guestsAmountByType}
                dataTid='holiday-summary-flight-items-inbound'
                reverse
                showSpeedyBoardingTooltip={isLuxuryPackage}
            />
        </>
    );
};

export default HolidaySummaryFlights;
