import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import SvgCalendarLined from 'frontend/components/icons-new/CalendarLined';

import styles from './DatesBasket.module.scss';

const DatesBasket: FunctionComponent = () => {
    const { booking, departureDate, arrivalDate } = useStore((stores: IHolidaysStores) => ({
        booking: stores.amendDatesStore.booking,
        departureDate: stores.amendDatesStore.selectedDepartureDate,
        arrivalDate: stores.amendDatesStore.selectedArrivalDate,
    }));

    return (
        <div className={styles.basketAmendDates} data-tid='dates-basket'>
            <SvgCalendarLined />
            <p className={styles.dates}>
                {formatDateL10n(
                    departureDate || booking?.package.transport.routes[0].depDate,
                    DATE_FORMATS.dateWithAbbrMonthNameAndYear,
                )}
                &nbsp;-&nbsp;
                {formatDateL10n(
                    arrivalDate || booking?.package.transport.routes[1].depDate,
                    DATE_FORMATS.dateWithAbbrMonthNameAndYear,
                )}
            </p>
        </div>
    );
};

export default observer(DatesBasket);
