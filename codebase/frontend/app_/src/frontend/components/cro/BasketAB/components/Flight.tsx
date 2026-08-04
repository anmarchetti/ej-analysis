import React, { FC, useMemo } from 'react';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getSeatBorderColor } from 'frontend/utils/seatAndBags.utils';
import { IFlightPassenger } from 'models/data/AncillariesInfo';
import { IRoute } from 'models/data/IRoute';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgBag from 'frontend/components/icons-new/Bag';
import IconPlainDeparture from 'frontend/components/icons-new/DepartureFilled';
import SeatSelectionDesktop from 'frontend/components/renderings/SeatAndBags/components/desktop/SeatSelectionDesktop';
import SeatBag from 'frontend/components/renderings/SeatAndBags/components/SeatBag';

import { getBagDataById } from './utils';

import BasketPopupStyles from './BasketPopup.module.scss';

interface IFlightProps {
    areFlightsExternal: boolean | undefined;
    flight: IRoute;
    haveSelectedSeats: boolean;
    passengers: IFlightPassenger[];
}

export enum LuggageAllowanceType {
    LargeOverheadBag = 'B0003',
}

const Flight: FC<IFlightProps> = ({ flight, passengers, areFlightsExternal, haveSelectedSeats }) => {
    const { getPhrase, isSeatMapFlowEnabled, totalGuestsQuantity } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isSeatMapFlowEnabled: stores.seatMapStore.isSeatMapFlowEnabled,
        totalGuestsQuantity: stores.bookingStore.totalGuestsQuantity,
    }));

    const routeInfo = () => {
        const date = formatDateL10n(flight.depDate, DATE_FORMATS.fullDate);
        const depTime = formatDateL10n(flight.depDate, DATE_FORMATS.time);
        const arrTime = formatDateL10n(flight.arrDate, DATE_FORMATS.time);

        return (
            <>
                <div className={BasketPopupStyles.pointHead} data-tid='route'>
                    {flight.depName} - {flight.arrName}
                </div>

                <div data-tid='flight-time'>
                    {date} {depTime} - {arrTime}
                </div>
            </>
        );
    };

    const largeBags = useMemo(() => getBagDataById(passengers, LuggageAllowanceType.LargeOverheadBag), [passengers]);

    return (
        <div className={BasketPopupStyles.point}>
            <IconPlainDeparture />

            <span data-tid={`${flight.direction}-flight`}>{routeInfo()}</span>
            {isSeatMapFlowEnabled && areFlightsExternal && (
                <div className={BasketPopupStyles.seatNumberWrapper}>
                    {haveSelectedSeats &&
                        passengers.map(person =>
                            person?.seat?.seatNumber ? (
                                <SeatSelectionDesktop
                                    key={person.index}
                                    text={person?.seat?.priceBand ?? ''}
                                    color={getSeatBorderColor(person?.seat?.priceBand)}
                                    seatNumber={person?.seat?.seatNumber}
                                />
                            ) : null,
                        )}
                </div>
            )}
            {!haveSelectedSeats && (
                <div className={classNames(BasketPopupStyles.noSeats)}>
                    {getPhrase(SitecoreDictionary.GlobalsLabelsNoSeatSelected)}
                </div>
            )}
            <SeatBag
                text={
                    totalGuestsQuantity > 1
                        ? getPhrase(SitecoreDictionary.SmallUnderSeatBagsPlural)
                        : getPhrase(SitecoreDictionary.SmallUnderSeatBagSingle)
                }
                count={totalGuestsQuantity}
            >
                <SvgBag className='seat-confirmation__bag-icon' />
            </SeatBag>
            {isSeatMapFlowEnabled && areFlightsExternal && (
                <>
                    {!!largeBags.count && (
                        <SeatBag icon={largeBags.icon} text={largeBags.text || ''} count={largeBags.count} />
                    )}
                </>
            )}
        </div>
    );
};

export default Flight;
