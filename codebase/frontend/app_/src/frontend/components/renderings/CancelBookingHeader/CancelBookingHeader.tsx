import { FC, useEffect, useMemo, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { buildFlightPlusHotelUrl } from 'frontend/utils/url.utils';
import { IBreadcrumb } from 'models/data/IBreadcrumb';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import PageHeader from 'frontend/components/common/PageHeader/PageHeader';

import styles from './CancelBookingHeader.module.scss';

interface ICancelBookingHeaderFields {
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TCancelBookingHeaderProps = ISitecoreComponent<ICancelBookingHeaderFields>;

const CancelBookingHeader: FC<TCancelBookingHeaderProps> = ({ fields }) => {
    const {
        getBreadcrumb,
        isCameFromMicroAppManage,
        getMicroAppManageBreadcrumb,
        booking,
        prevPagePath,
        isTradePortal,
        getPhrase,
        isLoading,
        isFlightPlusHotelFunnel,
    } = useStore(stores => ({
        getBreadcrumb: stores.layoutStore.getBreadcrumb,
        getMicroAppManageBreadcrumb: stores.layoutStore.getMicroAppManageBreadcrumb,
        isCameFromMicroAppManage: stores.layoutStore.isCameFromMicroAppManage,
        booking: stores.holidayCreditStore.booking,
        prevPagePath: stores.holidayCreditStore.prevPagePath,
        isTradePortal: stores.layoutStore.isTradePortal,
        getPhrase: stores.layoutStore.getPhrase,
        isLoading: stores.viewBookingStore.isLoading,
        isFlightPlusHotelFunnel: stores.queryParamStore.isFlightPlusHotelFunnel,
    }));

    const defaultPagePath = isTradePortal ? SitePath.TradePortalViewBooking : SitePath.ViewBooking;
    const [viewBookingBreadcrumb, setViewBookingBreadcrumb] = useState<IBreadcrumb>(
        getBreadcrumb(prevPagePath || defaultPagePath),
    );

    useEffect(() => {
        setViewBookingBreadcrumb(
            isCameFromMicroAppManage
                ? getMicroAppManageBreadcrumb(SitePath.ManageHub)
                : getBreadcrumb(prevPagePath || defaultPagePath),
        );
    }, [booking]);

    const breadcrumbs = useMemo(() => {
        if (isFlightPlusHotelFunnel) {
            return [
                {
                    key: viewBookingBreadcrumb.key,
                    value: buildFlightPlusHotelUrl(viewBookingBreadcrumb.value),
                },
                {
                    key: getPhrase(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsCancelBooking),
                    value: SitePath.CancelBooking,
                },
            ];
        }

        return [viewBookingBreadcrumb, getBreadcrumb(SitePath.CancelBooking)];
    }, [viewBookingBreadcrumb, isFlightPlusHotelFunnel, getPhrase, getBreadcrumb]);

    if (!fields) {
        return null;
    }

    const { Title, Subtitle } = fields;

    const { firstName = '', lastName = '' } = booking?.guests.find(guest => guest.isLead) || {};
    const subTitle = Tokenizer.replaceTokens(Subtitle.value, {
        [Tokens.PassengerName]: firstName,
        [Tokens.Surname]: lastName,
    });

    return (
        <PageHeader Title={Title} breadcrumbs={breadcrumbs}>
            {isLoading && isTradePortal ? (
                <div
                    className={classNames(styles.shimmerSubtitle, 'placeholder-shimmer')}
                    data-tid='subtitle-loading'
                />
            ) : (
                <Text tag='p' field={{ value: subTitle }} className={styles.subtitle} />
            )}

            {isTradePortal && isLoading && (
                <div className={styles.refsContainer} data-tid='booking-refs-loading'>
                    <div className={classNames(styles.shimmerRef, 'placeholder-shimmer')} />
                    <div className={classNames(styles.shimmerRef2, 'placeholder-shimmer')} />
                </div>
            )}
            {isTradePortal && !isLoading && (
                <div className={styles.refsContainer} data-tid='booking-refs'>
                    <div className={styles.refContainer} data-tid='booking-number-ref'>
                        <div className={styles.subtitle} data-tid='ref-label'>
                            {getPhrase(SitecoreDictionary.BookingHeaderLabelsHolidayReference)}
                        </div>
                        <div className={styles.ref} data-tid='ref-value'>
                            {booking?.bookingReference}
                        </div>
                    </div>
                    {firstName && lastName && (
                        <div className={styles.refContainer} data-tid='lead-passenger-ref'>
                            <div className={styles.subtitle} data-tid='ref-label'>
                                {getPhrase(SitecoreDictionary.BookingPassengersLabelsLeadPassenger)}
                            </div>
                            <div className={styles.ref} data-tid='ref-value'>
                                {firstName} {lastName}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </PageHeader>
    );
};

export default observer(CancelBookingHeader);
