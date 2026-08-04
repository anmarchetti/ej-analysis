import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getNumberOfGuestsByCategory } from 'frontend/utils/guestsValidation';
import { getSingleRoute } from 'frontend/utils/route.utils';
import { IRoute } from 'models/data/IRoute';
import { RouteDirection } from 'models/enum/RouteDirection';
import Calendar from 'frontend/components/icons-new/Calendar';
import HotelLined from 'frontend/components/icons-new/HotelLined';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';
import summaryDetailsStyles from 'frontend/components/renderings/SummaryBar/SummaryDetails/SummaryDetails.module.scss';

import styles from './SummaryHotelDetails.module.scss';

const SummaryHotelDetails: FC<ISummaryBarSitecoreFields> = ({
    RefundableLabel,
    NonRefundableLabel,
    ShowRefundableLabel,
}) => {
    const { getPhrase, offer } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        offer: stores.bookingStore.selectedOffer,
    }));

    if (!offer) return null;

    const getDates = (): string => {
        const outbound: Nullable<IRoute> = getSingleRoute(
            offer.transport.routes.filter(el => el.direction === RouteDirection.Outbound),
        );
        const inbound: Nullable<IRoute> = getSingleRoute(
            offer.transport.routes.filter(el => el.direction === RouteDirection.Inbound),
        );

        return `${formatDateL10n(outbound?.depDate, DATE_FORMATS.dateWithAbbrMonthName)} - ${formatDateL10n(
            inbound?.depDate,
            DATE_FORMATS.dateWithAbbrMonthName,
        )}`;
    };

    const getWhoValue = (): string => {
        const adults = offer.accom.unit.reduce((total, room) => total + room.occupation.adults, 0);
        const children = offer.accom.unit.reduce((total, room) => total + room.occupation.children, 0);
        const infants = offer.accom.unit.reduce((total, room) => total + room.occupation.infants, 0);

        return getNumberOfGuestsByCategory(getPhrase, adults, children, infants);
    };

    const isRefundable = offer.accom.unit[0]?.isRefundable;

    return (
        <div
            className={classNames(summaryDetailsStyles.category, styles.detailContainer)}
            aria-label='Hotel Summary Details'
        >
            <div data-tid='hotel-details-location' className={styles.hotelTitle}>
                {offer.hotel?.country.name}, {offer.hotel?.location.name}, {offer.hotel?.resort.name}
            </div>
            <div className={`${styles.flex} ${styles.flexAlignCenter} ${styles.infoGrid}`}>
                <div className={`${styles.flex} ${styles.flexAlignCenter}`} aria-hidden='true'>
                    <HotelLined />
                </div>
                <div data-tid='hotel-details-name' className={styles.normalText}>
                    {offer.hotel?.name}
                </div>
            </div>
            <div className={`${styles.flex} ${styles.flexAlignCenter} ${styles.infoGrid}`}>
                <div className={`${styles.flex} ${styles.flexAlignCenter}`} aria-hidden='true'>
                    <Calendar />
                </div>
                <div data-tid='hotel-details-dates' className={styles.normalText}>
                    {getDates()}
                </div>
            </div>
            <div data-tid='hotel-details-duration-guest' className={styles.normalText}>
                {getDurationLabel(getPhrase, offer.stay)} • {getWhoValue()}
            </div>
            {ShowRefundableLabel?.value && isRefundable !== undefined && (
                <Text
                    field={isRefundable ? RefundableLabel : NonRefundableLabel}
                    data-tid='hotel-details-refundable'
                    className={styles.normalText}
                    tag='div'
                />
            )}
        </div>
    );
};

export default observer(SummaryHotelDetails);
