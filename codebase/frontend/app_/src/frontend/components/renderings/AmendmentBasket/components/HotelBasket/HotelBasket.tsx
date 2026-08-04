import { FunctionComponent } from 'react';

import useStore from 'frontend/hooks/useStore';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BoardDetails from 'frontend/components/common/AmendHotelStickyHeader/components/BoardDetails/BoardDetails';
import DatesDetails from 'frontend/components/common/AmendHotelStickyHeader/components/DatesDetails/DatesDetails';
import FlightDetails from 'frontend/components/common/AmendHotelStickyHeader/components/FlightDetails/FlightDetails';
import HotelDetails from 'frontend/components/common/AmendHotelStickyHeader/components/HotelDetails/HotelDetails';
import LuggageDetails from 'frontend/components/common/AmendHotelStickyHeader/components/LuggageDetails/LuggageDetails';
import RatingsDetails from 'frontend/components/common/AmendHotelStickyHeader/components/RatingsDetails/RatingsDetails';
import RoomDetails from 'frontend/components/common/AmendHotelStickyHeader/components/RoomDetails/RoomDetails';
import TransferDetails from 'frontend/components/common/AmendHotelStickyHeader/components/TransferDetails/TransferDetails';
import { getHotelChangeInfo } from 'frontend/components/renderings/AmendHotel/AmendHotel.utils';

import styles from './HotelBasket.module.scss';

export interface IHotelBasketProps {
    /**
     * The amend hotel offer. If this is provided, the component will display the information from the amend offer.
     * Otherwise, it will display the information from the booking.
     */
    amendOffer?: IAmendHotelOffer;
    dataTid?: string;
    unchangedLabel?: string;
}

const HotelBasket: FunctionComponent<IHotelBasketProps> = ({
    amendOffer,
    unchangedLabel,
    dataTid = 'hotel-basket',
}) => {
    const { booking, getPhrase } = useStore(store => ({
        booking: store.viewBookingStore.booking,
        getPhrase: store.layoutStore.getPhrase,
    }));

    if (!booking) {
        return null;
    }

    const { transfer, startDate, endDate, roomType, boardType, hotel, location, hasSelectedNewHotel, routes } =
        getHotelChangeInfo(booking, amendOffer);

    return (
        <div data-tid={dataTid}>
            <HotelDetails className={styles.row} dataTid={`${dataTid}-hotel`} name={hotel?.name} location={location} />
            <RatingsDetails className={styles.ratings} dataTid={`${dataTid}-ratings`} {...hotel} />
            {!hasSelectedNewHotel && (
                <DatesDetails
                    className={styles.row}
                    dataTid={`${dataTid}-dates`}
                    endDate={endDate}
                    startDate={startDate}
                />
            )}
            <RoomDetails className={styles.row} dataTid={`${dataTid}-room`} roomType={roomType} />
            <BoardDetails className={styles.row} dataTid={`${dataTid}-board`} boardType={boardType} />
            <TransferDetails className={styles.row} dataTid={`${dataTid}-transfer`} transfer={transfer} />

            {hasSelectedNewHotel && (
                <>
                    <h4 className={styles.title}>{unchangedLabel}</h4>
                    <FlightDetails flightRoutes={routes} className={styles.row} dataTid={`${dataTid}-flights`} />
                    <DatesDetails
                        showOnlyDuration
                        className={styles.row}
                        dataTid={`${dataTid}-dates`}
                        endDate={endDate}
                        startDate={startDate}
                    />
                    <LuggageDetails dataTid={`${dataTid}-luggage`} booking={booking} />
                    <div className={styles.row} data-tid={`${dataTid}-atol-protected`}>
                        {getPhrase(SitecoreDictionary.HotelDetailsLabelsAtolProtected)}
                    </div>
                </>
            )}
        </div>
    );
};

export default HotelBasket;
