import { FunctionComponent, useEffect } from 'react';
import { InView } from 'react-intersection-observer';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { SitePath } from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import SvgCalendar from 'frontend/components/icons-new/Calendar';
import CountdownClock from 'frontend/components/icons-new/CountdownClock';
import SvgLocationPinFilled from 'frontend/components/icons-new/LocationPinFilled';

import { IUpcomingHolidayBlockFields } from './interfaces';
import { getDaysUntilDeparture, shouldShowDaysUntilDepartureBadge } from './utils';

import styles from './UpcomingHolidayBlock.module.scss';

type TUpcomingHolidayBlockProps = ISitecoreComponent<IUpcomingHolidayBlockFields>;

const UpcomingHolidayBlock: FunctionComponent<TUpcomingHolidayBlockProps> = ({ fields, rendering }) => {
    const {
        isLoggedIn,
        getPhrase,
        viewBookingsStore,
        routerStore,
        trackManageHolidayImpression,
        trackManageHolidayClick,
        sitePath,
    } = useStore((stores: IHolidaysStores) => ({
        isLoggedIn: stores.userStore.isLoggedIn,
        getPhrase: stores.layoutStore.getPhrase,
        viewBookingsStore: stores.viewBookingsStore,
        routerStore: stores.routerStore,
        trackManageHolidayImpression: stores.trackingStore.trackManageHolidayImpression,
        trackManageHolidayClick: stores.trackingStore.trackManageHolidayClick,
        sitePath: stores.layoutStore.sitePath,
    }));

    useEffect(() => {
        if (isLoggedIn) {
            viewBookingsStore.fetchBookingsFromApollo();
        } else {
            viewBookingsStore.clearApolloBookings();
        }
    }, [isLoggedIn, viewBookingsStore]);

    const apolloUpcomingBooking = viewBookingsStore.apolloUpcomingBooking;
    const upcomingHotelImagePath = viewBookingsStore.upcomingHotelImagePath;

    useEffect(() => {
        if (apolloUpcomingBooking?.hotelCode && apolloUpcomingBooking?.resortCode) {
            viewBookingsStore.fetchUpcomingHotelImage(
                apolloUpcomingBooking.hotelCode,
                apolloUpcomingBooking.resortCode,
            );
        }
    }, [viewBookingsStore, apolloUpcomingBooking?.hotelCode, apolloUpcomingBooking?.resortCode]);

    if (!fields || !isLoggedIn || !apolloUpcomingBooking) {
        return null;
    }

    const { departureDatetimeLocal, holidayDateStartLocal, holidayNightsCount, hotelLocation, hotelName } =
        apolloUpcomingBooking;

    const destinationUrl = sitePath + SitePath.ViewBookings;
    const daysUntilDeparture = getDaysUntilDeparture(departureDatetimeLocal);
    const isWithinDepartureWindow = shouldShowDaysUntilDepartureBadge(daysUntilDeparture);
    const countdownTemplate =
        (daysUntilDeparture === 1 ? fields.CountdownTextSingular?.value : fields.CountdownTextPlural?.value) || '';
    const countdownLabel =
        isWithinDepartureWindow && daysUntilDeparture !== null
            ? Tokenizer.replaceToken(countdownTemplate, Tokens.Count, daysUntilDeparture.toString())
            : '';

    const trackImpression = (inView: boolean): void => {
        if (!inView) return;

        trackManageHolidayImpression(
            rendering?.uid,
            fields.HeaderText?.value || '',
            fields.CTAText?.value || '',
            destinationUrl,
        );
    };

    const handleNavigate = (): void => {
        trackManageHolidayClick(
            rendering?.uid,
            fields.HeaderText?.value || '',
            fields.CTAText?.value || '',
            destinationUrl,
        );

        routerStore.redirectToViewBookingsPage();
    };

    const buttonLabel = `${fields.CTAText?.value}: ${hotelName}`;

    const renderCountdownBadge = (testId: string): JSX.Element | null => {
        if (!isWithinDepartureWindow) {
            return null;
        }

        return (
            <div className={styles.countdownBadge} data-tid={testId}>
                <CountdownClock className={styles.countdownIcon} />
                <span className={styles.countdownLabel}>{countdownLabel}</span>
            </div>
        );
    };

    return (
        <InView onChange={trackImpression} triggerOnce>
            <div className={styles.wrapper} data-tid='upcoming-holiday-block'>
                <div className={styles.container}>
                    <h2 className={styles.title} data-tid='upcoming-holiday-title'>
                        <Text field={fields.HeaderText} />
                    </h2>
                    <div className={styles.cardWrapper}>
                        <div className={styles.card} data-tid='upcoming-holiday-card'>
                            <div className={styles.imageContainer}>
                                <div className={styles.imageFallback} data-tid='destination-image-fallback' />
                                {upcomingHotelImagePath && (
                                    <img
                                        src={cmsUrls.media(upcomingHotelImagePath)}
                                        alt={hotelName}
                                        className={styles.image}
                                        data-tid='destination-image'
                                    />
                                )}
                            </div>
                            <div className={styles.content} data-tid='card-content'>
                                <div className={styles.details}>
                                    <p className={styles.hotelName} data-tid='hotel-name'>
                                        {hotelName}
                                    </p>
                                    {hotelLocation && (
                                        <div className={styles.locationRow}>
                                            <SvgLocationPinFilled className={styles.icon} />
                                            <p className={styles.location} data-tid='location'>
                                                {hotelLocation}
                                            </p>
                                        </div>
                                    )}
                                    <div className={styles.dateRow}>
                                        <SvgCalendar className={styles.icon} />
                                        <p className={styles.dateInfo} data-tid='date-info'>
                                            {formatDateL10n(holidayDateStartLocal, DATE_FORMATS.fullDate)},{`\u00A0`}
                                            {getDurationLabel(getPhrase, holidayNightsCount)}
                                        </p>
                                    </div>
                                </div>
                                <div className={styles.desktopActions}>
                                    {renderCountdownBadge('upcoming-holiday-desktop-countdown-badge')}
                                    <Button
                                        className={styles.desktopManageButton}
                                        dataTid='upcoming-holiday-desktop-button'
                                        onClick={handleNavigate}
                                        aria-label={buttonLabel}
                                    >
                                        <Text field={fields.CTAText} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        {isWithinDepartureWindow && (
                            <div className={styles.mobileBadgeWrapper}>
                                {renderCountdownBadge('upcoming-holiday-mobile-countdown-badge')}
                            </div>
                        )}
                        <div className={styles.mobileActions}>
                            <Button
                                className={styles.mobileManageButton}
                                dataTid='upcoming-holiday-mobile-button'
                                isFullWidth
                                onClick={handleNavigate}
                                aria-label={buttonLabel}
                            >
                                <Text field={fields.CTAText} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </InView>
    );
};

export default observer(UpcomingHolidayBlock);
