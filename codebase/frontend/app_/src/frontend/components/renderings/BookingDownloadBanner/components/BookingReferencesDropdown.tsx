import { FunctionComponent, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays/create-stores';
import { getFlightsReferences } from 'frontend/utils/route.utils';
import { IRoute } from 'models/data/IRoute';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AccordionButton from 'frontend/components/common/AccordionButton';
import { TBookingDownloadBannerFields } from 'frontend/components/renderings/BookingDownloadBanner/BookingDownloadBanner';

import BookingRefDropdownContent from './DropdownContent/BookingRefDropdownContent';
import BookingReferencesDropdownItem from './BookingReferencesDropdownItem';

import styles from './BookingReferencesDropdown.module.scss';

export type TBookingReferencesDropdownProps = {
    bookingReference: string;
    bookingRoutes: IRoute[];
    fields: TBookingDownloadBannerFields;
    isCopyButtonShown: boolean;
};

const BookingReferencesDropdown: FunctionComponent<TBookingReferencesDropdownProps> = ({
    fields,
    bookingReference,
    bookingRoutes,
    isCopyButtonShown,
}: TBookingReferencesDropdownProps) => {
    const [isExpanded, toggleExpand] = useState(false);
    const { isFlightAndHotelPackage } = useStore(stores => ({
        isFlightAndHotelPackage: isHolidayStore(stores) && stores.viewBookingStore.isFlightAndHotelPackage,
    }));

    const {
        ReferencesTitle,
        HolidayReferenceTitle,
        HolidayReferenceDescription,
        FlightReferenceTitle,
        FlightReferenceDescription,
        CopyButtonAriaLabel,
    } = fields;

    const flightsRefs = getFlightsReferences(bookingRoutes);

    return (
        <div className={styles.container}>
            <AccordionButton
                className={styles.accordionBtn}
                isExpanded={isExpanded}
                buttonContent={
                    <div className={styles.accordionBtnText}>
                        <span className={styles.refNumberLabel}>{ReferencesTitle?.value}</span>
                        <span className={styles.refNumber}>{bookingReference}</span>
                    </div>
                }
                dataTid='booking-refs-dropdown-btn'
                onClick={() => toggleExpand(!isExpanded)}
            />

            <ul
                className={classNames(styles.dropdown, {
                    [styles.isExpanded]: isExpanded,
                    [styles.multipleFlights]: flightsRefs.length > 1,
                })}
                data-tid='booking-ref-dropdown'
            >
                {flightsRefs.length > 1 ? (
                    <BookingRefDropdownContent
                        bookingRef={bookingReference}
                        bookingRoutes={bookingRoutes}
                        bookingRefHelpTextKey={
                            isFlightAndHotelPackage
                                ? SitecoreDictionary.BookingHeaderLabelsMultipleFlightBookingRefTitle
                                : SitecoreDictionary.BookingHeaderLabelsMultipleFlightHolidayRefTitle
                        }
                        flightRefHelpTextKey={SitecoreDictionary.BookingHeaderLabelsMultipleFlightRefTitle}
                    />
                ) : (
                    <>
                        <BookingReferencesDropdownItem
                            refNumber={bookingReference}
                            title={HolidayReferenceTitle?.value}
                            description={HolidayReferenceDescription?.value}
                            ariaLabel={CopyButtonAriaLabel?.value}
                            isCopyButtonShown={isCopyButtonShown}
                            dataTid='holiday-ref-dropdown-item'
                        />
                        {!!flightsRefs[0] && (
                            <BookingReferencesDropdownItem
                                refNumber={flightsRefs[0]}
                                title={FlightReferenceTitle?.value}
                                description={FlightReferenceDescription?.value}
                                ariaLabel={CopyButtonAriaLabel?.value}
                                isCopyButtonShown={isCopyButtonShown}
                                dataTid='flight-ref-dropdown-item'
                            />
                        )}
                    </>
                )}
            </ul>
        </div>
    );
};

export default observer(BookingReferencesDropdown);
