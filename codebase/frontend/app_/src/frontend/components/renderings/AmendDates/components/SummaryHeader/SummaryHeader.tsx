import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getBookingAirportCodes } from 'frontend/utils/airports.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import IconCalendar from 'frontend/components/icons/Calendar';
import SVGDepartureFilled from 'frontend/components/icons-new/DepartureFilled';

import styles from './SummaryHeader.module.scss';

interface ISummaryHeaderProps {
    numberOfNightsLabel: string;
}

function SummaryHeader({ numberOfNightsLabel }: ISummaryHeaderProps) {
    const {
        booking,
        departureDate,
        arrivalDate,
        numberOfNights,
        getPhrase,
        isDatesChanged,
        submitDates,
        isSubmitDatesLoading,
    } = useStore((stores: IHolidaysStores) => ({
        booking: stores.amendDatesStore.booking,
        departureDate: stores.amendDatesStore.selectedDepartureDate,
        arrivalDate: stores.amendDatesStore.selectedArrivalDate,
        numberOfNights: stores.amendDatesStore.numberOfNights,
        getPhrase: stores.layoutStore.getPhrase,
        isDatesChanged: stores.amendDatesStore.isDatesChanged,
        submitDates: stores.amendDatesStore.submitDates,
        isSubmitDatesLoading: stores.amendDatesStore.isSubmitDatesLoading,
    }));

    const [departureAirportCode, arrivalAirportCode] = getBookingAirportCodes(booking as IBookingInfo);

    if (numberOfNights === 0) {
        return null;
    }

    return (
        <div className={styles.summaryHeader} data-tid='date-change-summary-header'>
            <div className={styles.summaryHeaderInner}>
                <div className={styles.flightDetails}>
                    <span className='d-flex align-items-center pe-5'>
                        <SVGDepartureFilled />
                        <span>
                            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                            <span className={styles.airport}>{departureAirportCode}</span>{' '}
                            {formatDateL10n(
                                departureDate || booking?.package.transport.routes[0].depDate,
                                DATE_FORMATS.fullDate,
                            )}
                        </span>
                    </span>
                    <span className='d-flex align-items-center pe-5'>
                        <SVGDepartureFilled className='icon--reflect-x' />
                        <span>
                            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                            <span className={styles.airport}>{arrivalAirportCode}</span>{' '}
                            {formatDateL10n(
                                arrivalDate || booking?.package.transport.routes[1].depDate,
                                DATE_FORMATS.fullDate,
                            )}
                        </span>
                    </span>
                    <span className={styles.durationDetails}>
                        <IconCalendar isUnwrapped />
                        <span>{numberOfNightsLabel}</span>
                    </span>
                </div>
                <Button
                    onClick={submitDates}
                    disabled={!isDatesChanged}
                    isLoading={isSubmitDatesLoading}
                    data-tid='amend-header-cta'
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                </Button>
            </div>
        </div>
    );
}

export default observer(SummaryHeader);
