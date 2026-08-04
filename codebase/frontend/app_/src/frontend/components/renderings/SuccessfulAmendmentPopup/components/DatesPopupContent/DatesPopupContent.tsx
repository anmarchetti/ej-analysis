import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { formatDateL10n, getDaysDifference } from 'frontend/utils/date.utils';
import SvgCalendarLined from 'frontend/components/icons-new/CalendarLined';
import styles from 'frontend/components/renderings/SuccessfulAmendmentPopup/SuccessfulAmendmentPopup.module.scss';

const DatesPopupContent = () => {
    const { booking, getPhrase } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!booking) {
        return null;
    }

    const { startDate, endDate } = booking.package.accom;
    const startDateFormatted = formatDateL10n(startDate, DATE_FORMATS.fullDate);
    const endDateFormatted = formatDateL10n(endDate, DATE_FORMATS.fullDate);
    const numberOfNights = getDaysDifference(new Date(endDate), new Date(startDate));
    const totalNights = getDurationLabel(getPhrase, numberOfNights);

    return (
        <div data-tid='dpc-container' className={styles.datesContent}>
            <SvgCalendarLined />
            <span>
                <span data-tid='dpc-start-date'>{startDateFormatted}</span> - <br />
                <span data-tid='dpc-end-date'>{endDateFormatted}</span>,{' '}
                <span data-tid='dpc-nights'>{totalNights}</span>
            </span>
        </div>
    );
};

export default observer(DatesPopupContent);
