import { FC } from 'react';
import classNames from 'classnames';

import { Anchor } from 'code/anchors';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import { getIdFromAnchor } from 'frontend/utils/navigation.utils';
import { groupPassengersByFlightRefs } from 'frontend/utils/passenger.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ILeadPassenger } from 'models/data/ILeadPassenger';
import { IRoute } from 'models/data/IRoute';
import { IGuest } from 'models/data/IValidPackageInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import ReferenceItem from 'frontend/components/common/Booking/BookingRefs/ReferenceItem/ReferenceItem';
import Passenger from 'frontend/components/common/Booking/Passenger/Passenger';
import Button from 'frontend/components/common/Button';
import ViewBookingComponentWrapper from 'frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper';
import {
    useAmendPassengersLocalStore,
    withAmendPassengersLocalStore,
} from 'frontend/components/renderings/AmendPassengers/stores/amendPassengerLocalStore';

import PassengerDetailsAction from './PassengerDetailsAction/PassengerDetailsAction';

import styles from './PassengerDetails.module.scss';

interface IPassengerDetailsProps {
    flights: IRoute[];
    guests: IGuest[];
    isBookingCanceled: boolean;
    isCheckInAvailable: boolean;
    leadPassenger: ILeadPassenger;
    isExternalAgency?: boolean;
    isLeadLoggedIn?: boolean;
    onAmendPassengerClick?: (e: React.MouseEvent) => void;
    showLeadEmailOnly?: boolean;
}

export const PassengerDetails: FC<IPassengerDetailsProps> = ({
    leadPassenger,
    guests,
    flights,
    isExternalAgency,
    isLeadLoggedIn,
    isCheckInAvailable,
    isBookingCanceled,
    showLeadEmailOnly,
    onAmendPassengerClick = () => {},
}) => {
    const { tracking } = useAmendPassengersLocalStore();
    const { getPhrase, getSetting, isAmendCTAVisible, booking } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        booking: stores.viewBookingStore.booking,
        isAmendCTAVisible: isHolidayStore(stores) && stores.amendPassengerStore.isAmendCTAVisible,
    }));

    const passengersByFlights = groupPassengersByFlightRefs(guests, flights);

    // If there no data about passengers on flights, show all guests as one group.
    const passengerByFlightsList: [string | null, IGuest[]][] =
        passengersByFlights.size > 0 ? Array.from(passengersByFlights.entries()) : [[null, guests]];

    const hasMultipleFlightsRefs = passengersByFlights.size > 1;

    const handleAmendPassengerClick = (e: React.MouseEvent) => {
        tracking.clickToAmendPassengerPageLink(booking!.bookingReference);
        onAmendPassengerClick(e);
    };

    const renderGuestGroup = (flightRef, passengers) => {
        const flightLeadPassenger = passengers[0];

        const checkInLink = flightRef
            ? Tokenizer.replaceTokens(getSetting(SiteSettings.CheckInLink), {
                  [Tokens.ReferenceNumber]: flightRef,
                  [Tokens.Surname]: flightLeadPassenger.lastName,
              })
            : undefined;

        return (
            <div className={styles.guestsGroupWithRef} key={String(flightRef)}>
                {flightRef && (
                    <div className={styles.flightRefWrapper} data-tid='flight-ref-wrapper'>
                        <ReferenceItem
                            dataTid='flight-ref'
                            title={getPhrase(SitecoreDictionary.BookingHeaderLabelsFlightReference)}
                            referenceNumber={flightRef}
                            onClick={(): void => {
                                !!flightRef && copyToClipboard(flightRef);
                            }}
                            className={styles.flightReference}
                            refNumberClassName={styles.flightReferenceNumber}
                        />
                    </div>
                )}
                <div className={styles.group}>
                    <Passenger
                        key={flightLeadPassenger.index}
                        passenger={flightLeadPassenger}
                        leadPassenger={flightLeadPassenger.isLead ? leadPassenger : undefined}
                        isLeadLoggedIn={isLeadLoggedIn}
                        isExternalAgency={isExternalAgency}
                        showLeadEmailOnly={showLeadEmailOnly}
                        // Show flight label only if there are multiple flights and it's the first passenger on flight
                        showFlightLabel={hasMultipleFlightsRefs}
                        flightRef={flightRef}
                        className={classNames(styles.leadPassenger, {
                            [styles.soloPassenger]: passengers.length === 1,
                        })}
                    />
                    {passengers.length > 1 && <div className={styles.divider} />}
                    <div className={styles.nonLeads}>
                        {passengers.slice(1).map(passenger => (
                            <Passenger
                                key={passenger.index}
                                passenger={passenger}
                                isExternalAgency={isExternalAgency}
                            />
                        ))}
                    </div>
                </div>

                {!isBookingCanceled &&
                    isCheckInAvailable &&
                    hasMultipleFlightsRefs &&
                    (checkInLink ? (
                        <a
                            className='btn btn--medium passenger-details__check-in no-print'
                            href={checkInLink}
                            rel='noopener noreferrer'
                            target='_blank'
                        >
                            {getPhrase(SitecoreDictionary.GlobalsButtonsCheckIn)}
                        </a>
                    ) : (
                        <Button className='passenger-details__check-in no-print' isMedium disabled>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsCheckIn)}
                        </Button>
                    ))}
            </div>
        );
    };

    return (
        <ViewBookingComponentWrapper
            dataTid='booking-confirmation-info'
            Title={{ value: getPhrase(SitecoreDictionary.BookingPassengersLabelsTitle) }}
            id={getIdFromAnchor(Anchor.BookingPassengers)}
            Subtitle={
                hasMultipleFlightsRefs
                    ? { value: getPhrase(SitecoreDictionary.BookingPassengersLabelsMultipleFlightsTextHTML) }
                    : undefined
            }
        >
            <div className={styles.passengerDetails}>
                <div className={styles.groups}>
                    {passengerByFlightsList.map(([flightRef, passengers]) => renderGuestGroup(flightRef, passengers))}
                </div>
                {isAmendCTAVisible && (
                    <PassengerDetailsAction onClick={handleAmendPassengerClick} className={styles.amendCTA} />
                )}
            </div>
        </ViewBookingComponentWrapper>
    );
};

export default withAmendPassengersLocalStore(PassengerDetails) as unknown as typeof PassengerDetails;
