import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays/create-stores';
import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import { getFullPassengerName, groupPassengersByFlightRefs } from 'frontend/utils/passenger.utils';
import { IRoute } from 'models/data/IRoute';
import { IGuest } from 'models/data/IValidPackageInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ReferenceItem from 'frontend/components/common/Booking/BookingRefs/ReferenceItem/ReferenceItem';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './BookingRefDropdownContent.module.scss';

interface IBookingRefDropdownContentProps {
    bookingRoutes: IRoute[];
    bookingRef?: string;
    bookingRefHelpTextKey?: string;
    flightRefHelpTextKey?: string;
    helpText?: ISitecoreField<string>;
    onLinkClick?: (e: MouseEvent) => void;
}

const BookingRefDropdownContent: React.FC<IBookingRefDropdownContentProps> = ({
    bookingRef,
    bookingRoutes,
    bookingRefHelpTextKey,
    flightRefHelpTextKey,
    helpText,
    onLinkClick,
}) => {
    const { getPhrase, booking, isFlightAndHotelPackage } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        booking: stores.viewBookingStore.booking,
        isFlightAndHotelPackage:
            isHolidayStore(stores) &&
            (stores.viewBookingStore.isFlightAndHotelPackage || stores.bookingStore.isFlightAndHotelPackage),
    }));

    const passengersByFlights = groupPassengersByFlightRefs(booking?.guests || [], bookingRoutes);

    // If there no data about passengers on flights, show all guests as one group.
    const passengerByFlightsList: [string | null, IGuest[]][] =
        passengersByFlights.size > 0 ? Array.from(passengersByFlights.entries()) : [[null, booking?.guests || []]];

    return (
        <div className={styles.container}>
            {bookingRef && (
                <div className={styles.bookingRef}>
                    <div className={styles.refItem}>
                        {bookingRefHelpTextKey && (
                            <RichTextDictionary className={styles.helpText} dictionaryKey={bookingRefHelpTextKey} />
                        )}
                        <ReferenceItem
                            dataTid='booking-ref'
                            title={getPhrase(
                                isFlightAndHotelPackage
                                    ? SitecoreDictionary.BookingHeaderLabelsBookingReference
                                    : SitecoreDictionary.BookingHeaderLabelsHolidayReference,
                            )}
                            referenceNumber={bookingRef}
                            onClick={(): void => {
                                !!bookingRef && copyToClipboard(bookingRef);
                            }}
                            titleClassName={styles.refTitle}
                            className={styles.ref}
                            refNumberClassName={styles.refNumber}
                        />
                    </div>
                </div>
            )}
            <div
                className={classNames({
                    [styles.flightRefWithBorder]: !!bookingRef,
                    [styles.borderInside]: !bookingRef,
                })}
            >
                {flightRefHelpTextKey && (
                    <RichTextDictionary className={styles.helpText} dictionaryKey={flightRefHelpTextKey} />
                )}

                {passengerByFlightsList.map(([flightRef, passengers]) =>
                    flightRef ? (
                        <div key={flightRef} className={styles.refItem}>
                            <ReferenceItem
                                dataTid='flight-ref'
                                title={getPhrase(SitecoreDictionary.BookingHeaderLabelsFlightReference)}
                                referenceNumber={flightRef}
                                onClick={(): void => {
                                    !!flightRef && copyToClipboard(flightRef);
                                }}
                                titleClassName={styles.refTitle}
                                className={styles.ref}
                                refNumberClassName={styles.refNumber}
                            />
                            <div className={styles.flightGuests}>
                                {passengers.map((guest, i) => (
                                    <div className={styles.guest} key={guest?.index}>
                                        <span className={styles.guestName}>
                                            {getFullPassengerName(guest, getPhrase)}
                                        </span>
                                        {i === 0 && (
                                            <div className={styles.leadPassengerPill}>
                                                {getPhrase(SitecoreDictionary.BookingPassengersLabelsLeadPassenger)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        ''
                    ),
                )}
            </div>

            {helpText?.value && (
                <RichTextWithLinks field={helpText} className={styles.scrollInfo} onLinkClick={onLinkClick} />
            )}
        </div>
    );
};

export default BookingRefDropdownContent;
