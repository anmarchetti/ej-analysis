import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n, getTimeWithoutSeconds } from 'frontend/utils/date.utils';
import { convertHtmlToTextWithReplacingBRsWithSpaces } from 'frontend/utils/string.utils';
import { getLeadGuestLastName } from 'frontend/utils/viewBooking.utils';
import { BookingStatus } from 'models/enum/BookingStatus';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgCalendar from 'frontend/components/icons-new/Calendar';
import SvgParking from 'frontend/components/icons-new/Parking';

import styles from './BookedAirportParking.module.scss';

export interface IBookedAirportParkingFields {
    BookedAirportParkingBottomLine: ISitecoreField<string>;
    BookedAirportParkingCarRegistrationButton: ISitecoreField<ISitecoreLink>;
    BookedAirportParkingReferenceTitle: ISitecoreField<string>;
    BookedAirportParkingSectionTitle: ISitecoreField<string>;
}

export const BookedAirportParking: FC<ISitecoreComponent<IBookedAirportParkingFields>> = ({ fields }) => {
    const { isViewBookingPage, booking } = useStore((stores: IHolidaysStores) => ({
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        booking: stores.viewBookingStore.booking || stores.bookingStore.booking,
    }));

    const {
        BookedAirportParkingBottomLine,
        BookedAirportParkingCarRegistrationButton,
        BookedAirportParkingReferenceTitle,
        BookedAirportParkingSectionTitle,
    } = fields || {};

    if (!booking) {
        return null;
    }

    const { airportParking, bookingStatus } = booking;
    const leadGuestLastName: string = getLeadGuestLastName(booking);

    if (!airportParking) {
        return null;
    }

    const {
        title: parkingName,
        address,
        bookingDetails: { startTime, endTime, startDate, endDate, extRefId },
    } = airportParking;

    const formattedStartDate: string = formatDateL10n(startDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr);
    const formattedEndDate: string = formatDateL10n(endDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr);
    const formattedPeriodOfTime: string = `${formattedStartDate} ${getTimeWithoutSeconds(
        startTime,
    )} - ${formattedEndDate} ${getTimeWithoutSeconds(endTime)}`;

    const sanitizedAddress: string = convertHtmlToTextWithReplacingBRsWithSpaces(address);
    const bookedAirportParkingReference = `${BookedAirportParkingReferenceTitle?.value || ''} ${extRefId || ''}`;

    const getCarRegistrationUrl = (): string | undefined => {
        const href = BookedAirportParkingCarRegistrationButton?.value?.href;

        if (href && leadGuestLastName) {
            const url = new URL(BookedAirportParkingCarRegistrationButton.value.href);
            url.searchParams.append('bkref', extRefId);
            url.searchParams.append('surname', leadGuestLastName);

            return url.toString();
        }

        return undefined;
    };
    const carRegistrationUrl: string | undefined = getCarRegistrationUrl();
    const isBookingCanceled = bookingStatus === BookingStatus.Canceled;
    const showCarRegistrationAndFAQ = isViewBookingPage && !isBookingCanceled;

    return (
        <div className='holiday-summary-item' data-tid='booked-airport-parking-summary-item'>
            <Text
                tag='h3'
                className='holiday-summary-item__title'
                data-tid='booked-airport-parking-title'
                field={BookedAirportParkingSectionTitle}
            />
            <div className={styles.container}>
                <div className={styles.fraction}>
                    <SvgParking className={styles.svgIcon} />
                    <div data-tid='booked-parking-name'>{parkingName}</div>
                    <div data-tid='booked-parking-address'>{sanitizedAddress}</div>
                </div>
                <div className={styles.fraction}>
                    <SvgCalendar className={styles.svgIcon} />
                    <div data-tid='booked-parking-date'>{formattedPeriodOfTime}</div>
                    <div data-tid='booked-parking-reference'>{bookedAirportParkingReference}</div>
                </div>
                {showCarRegistrationAndFAQ && BookedAirportParkingCarRegistrationButton && carRegistrationUrl && (
                    <div className={styles.buttonContainer}>
                        <Button
                            className={styles.button}
                            data-tid='booked-parking-button'
                            isOutlined
                            isSmall
                            disabled={!extRefId}
                            onClick={(): Window | null =>
                                window.open(carRegistrationUrl, BookedAirportParkingCarRegistrationButton.value.target)
                            }
                        >
                            {BookedAirportParkingCarRegistrationButton.value.text}
                        </Button>
                    </div>
                )}
            </div>
            {showCarRegistrationAndFAQ && BookedAirportParkingBottomLine && (
                <RichTextWithLinks
                    field={BookedAirportParkingBottomLine}
                    className={styles.richText}
                    dataId='bottom-line'
                />
            )}
        </div>
    );
};

export default observer(BookedAirportParking);
