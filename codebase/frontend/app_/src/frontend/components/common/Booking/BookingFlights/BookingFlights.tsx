import { FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { IRoute } from 'models/data/IRoute';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FlightsDetails, { IFlightsDetailsProps } from 'frontend/components/common/FlightsDetails/FlightsDetails';
import ViewBookingComponentWrapper from 'frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper';

import AmendFlightsButton from './AmendFlightsButton/AmendFlightsButton';

import styles from './BookingFlights.module.scss';

interface IFlightsProps {
    fields: IFlightsDetailsProps['fields'];
    routes: IRoute[];
    csMask?: boolean;
    lateCheckoutBanner?: JSX.Element;
    onAmendFlightsClick?: (e) => void;
}

const BookingFlights: FC<IFlightsProps> = ({ routes, lateCheckoutBanner, onAmendFlightsClick, csMask, fields }) => {
    const { getPhrase, isAmendCTAVisible, isNoAvailableFlightsPopupShown, isLuxuryPackage } = useStore(
        (stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            isAmendCTAVisible: isHolidayStore(stores) && stores.amendFlightsStore.isAmendCTAVisible,
            isNoAvailableFlightsPopupShown:
                isHolidayStore(stores) && stores.amendFlightsStore.isNoAvailableFlightsPopupShown,
            isLuxuryPackage: stores.viewBookingStore.isLuxuryPackage,
        }),
    );
    const [isAmendFlightsCTAHidden, setIsAmendFlightsCTAHidden] = useState(false);

    useEffect(() => {
        // Remove Amend Flights button if no available flights
        if (isNoAvailableFlightsPopupShown || isLuxuryPackage) {
            setIsAmendFlightsCTAHidden(true);
        }
    }, [isNoAvailableFlightsPopupShown, isLuxuryPackage]);

    return (
        <ViewBookingComponentWrapper
            dataTid='booking-flights'
            Title={{ value: getPhrase(SitecoreDictionary.BookingSummaryTitlesFlights) }}
        >
            <div className={styles.flightsSummary} data-cs-mask={csMask}>
                <FlightsDetails routes={routes} isIconOrange shouldShowTerminal fields={fields} />

                {isAmendCTAVisible && !isAmendFlightsCTAHidden && <AmendFlightsButton onClick={onAmendFlightsClick} />}
            </div>

            {lateCheckoutBanner}
        </ViewBookingComponentWrapper>
    );
};

export default observer(BookingFlights);
