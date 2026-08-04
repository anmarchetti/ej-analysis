import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISelectedSeat, ISelectedSeatDetails } from 'models/data/ISeatMapStore';
import { sectorIds } from 'models/data/SeatsSectorIds';
import { SeatType } from 'models/enum/SeatType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SVGDepartureFilled from 'frontend/components/icons-new/DepartureFilled';
import styles from 'frontend/components/renderings/SuccessfulAmendmentPopup/SuccessfulAmendmentPopup.module.scss';

const SeatsPopupContent = () => {
    const { booking, getPhrase } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const seats = booking?.seatSelection;

    if (!seats) {
        return null;
    }

    const outboundSeat = seats.find(el => el.sectorId === sectorIds[0]);
    const inboundSeat = seats.find(el => el.sectorId === sectorIds[1]);

    const getColorByPriceBand = (priceBand: SeatType) => {
        let className = 'standard';

        if (priceBand === SeatType.ExtraLegroom) {
            className = 'extra-legroom';
        }

        if (priceBand === SeatType.UpFront) {
            className = 'up-front';
        }

        return className;
    };

    const seatsLength = outboundSeat?.seats?.length || inboundSeat?.seats?.length || 0;

    const renderSeat = (flight: ISelectedSeat, isOutbound?: boolean) => (
        <div className={styles.itemFlight} data-tid={`flight-${flight.flightNumber}`}>
            <div className={styles.flightDetails} data-tid={`flight-direction-${isOutbound ? 'outbound' : 'inbound'}`}>
                <SVGDepartureFilled className={classNames(styles.itemIcon, !isOutbound && 'icon--reflect-x')} />

                <span className={styles.itemDirection}>
                    {isOutbound
                        ? getPhrase(SitecoreDictionary.AmendSeatsConfirmationPopupLabelsOutbound)
                        : getPhrase(SitecoreDictionary.AmendSeatsConfirmationPopupLabelsInbound)}
                </span>
            </div>
            <div className={styles.itemSeats}>
                {flight.seats?.length
                    ? flight.seats.map((seat: ISelectedSeatDetails, index: number) => {
                          const priceBand = seat.priceBand ?? SeatType.Standard;

                          return (
                              <div key={`${flight.sectorId}-${index}`} className={styles.itemSeat}>
                                  <span
                                      className={`seat-confirmation__seat-number seat-confirmation__seat-number--${getColorByPriceBand(
                                          priceBand,
                                      )}`}
                                  >
                                      {seat.seatNumber}
                                  </span>
                                  <span className={styles.itemPriceBand}>{priceBand}</span>
                              </div>
                          );
                      })
                    : Array.from({ length: seatsLength }, (el, i) => (
                          <div
                              key={`${flight.sectorId}-${i}`}
                              className={classNames(styles.itemSeat, styles.itemSeatNotSelected)}
                          >
                              {getPhrase(SitecoreDictionary.AmendSeatsConfirmationPopupLabelsNoSeatSelected)}
                          </div>
                      ))}
            </div>
        </div>
    );

    return (
        <div className={styles.itemSeatsDetails}>
            {outboundSeat && renderSeat(outboundSeat, true)}
            {inboundSeat && renderSeat(inboundSeat)}
        </div>
    );
};

export default observer(SeatsPopupContent);
