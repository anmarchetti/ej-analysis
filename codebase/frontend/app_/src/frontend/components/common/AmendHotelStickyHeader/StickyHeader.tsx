import { FunctionComponent } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import StickyBox from 'frontend/components/common/StickyBox';
import { getHotelChangeInfo } from 'frontend/components/renderings/AmendHotel/AmendHotel.utils';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

import BoardDetails from './components/BoardDetails/BoardDetails';
import DatesDetails from './components/DatesDetails/DatesDetails';
import HotelConfirmationCTA from './components/HotelConfirmationCTA/HotelConfirmationCTA';
import HotelDetails from './components/HotelDetails/HotelDetails';
import RatingsDetails from './components/RatingsDetails/RatingsDetails';
import RoomDetails from './components/RoomDetails/RoomDetails';
import TotalPrice from './components/TotalPrice/TotalPrice';
import TransferDetails from './components/TransferDetails/TransferDetails';

import styles from './StickyHeader.module.scss';

export interface IStickyHeaderProps {
    dataTid: string;
    /**
     * The amend hotel offer. If this is provided, the component will display the information from the amend offer.
     * Otherwise, it will display the information from the booking.
     */
    amendOffer?: IAmendHotelOffer;
    tooltipLabel?: string;
}

const StickyHeader: FunctionComponent<IStickyHeaderProps> = ({ amendOffer, dataTid, tooltipLabel }) => {
    const { booking } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
    }));

    if (!booking) {
        return null;
    }

    const { transfer, startDate, endDate, roomType, boardType, hotel, location, hasSelectedNewHotel } =
        getHotelChangeInfo(booking, amendOffer);

    return (
        <StickyBox
            render={() => (
                <div className={styles.header} data-tid={dataTid}>
                    <ComponentWrapper>
                        <div className={styles.basket} data-tid={`${dataTid}-basket`}>
                            <div className={styles.details}>
                                <div className={classNames(styles.column, styles.withSeparator)}>
                                    <HotelDetails
                                        className={styles.row}
                                        dataTid={`${dataTid}-hotel`}
                                        name={hotel?.name}
                                        location={location}
                                    />
                                    <RatingsDetails className={styles.row} dataTid={`${dataTid}-ratings`} {...hotel} />
                                </div>

                                <div className={classNames(styles.column, styles.withSeparator)}>
                                    <DatesDetails
                                        className={styles.row}
                                        dataTid={`${dataTid}-dates`}
                                        endDate={endDate}
                                        startDate={startDate}
                                        showOnlyDuration={false}
                                    />
                                    <RoomDetails
                                        className={styles.row}
                                        dataTid={`${dataTid}-room`}
                                        roomType={roomType}
                                    />
                                </div>

                                <div className={styles.column}>
                                    <BoardDetails
                                        className={styles.row}
                                        dataTid={`${dataTid}-board`}
                                        boardType={boardType}
                                    />
                                    <TransferDetails
                                        className={styles.row}
                                        dataTid={`${dataTid}-transfer`}
                                        transfer={transfer}
                                    />
                                </div>
                            </div>

                            {hasSelectedNewHotel && (
                                <div className={styles.priceSection}>
                                    <div className={(styles.column, styles.withDiagonalGreySeparator)}>
                                        <TotalPrice dataTid={`${dataTid}-total-price`} tooltipLabel={tooltipLabel} />
                                    </div>
                                    <div className={(styles.column, styles.withNoOverflow, styles.buttonColumn)}>
                                        <HotelConfirmationCTA dataTid={`${dataTid}-hotel-selection-cta`} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ComponentWrapper>
                </div>
            )}
        />
    );
};

export default StickyHeader;
