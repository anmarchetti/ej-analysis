import { FC, useContext } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { BookingContext } from 'frontend/context/BookingContext';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getDateWithoutDSTOffset } from 'frontend/utils/date.utils';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getBookingDestination, getBookingRoute } from 'frontend/utils/viewBooking.utils';
import { BookingStatus } from 'models/enum/BookingStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import Timer from 'frontend/components/common/Booking/Header/Timer';
import LuxuryBar from 'frontend/components/common/LuxuryBar/LuxuryBar';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import useBookingDestImage from './hooks/useBookingDestImage';
import { getHeroBannerTitle } from './utils/utils';

import styles from './BookingHeroBanner.module.scss';

interface IBookingHeroBannerParams {
    ShowCountdown: TSitecoreCheckboxValue;
}

interface IBookingHeroBannerFields {
    AltTextAbove: ISitecoreField<string>;
    TextAbove: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TBookingHeroBannerProps = ISitecoreComponent<IBookingHeroBannerFields, IBookingHeroBannerParams>;

export const BookingHeroBanner: FC<TBookingHeroBannerProps> = ({ rendering, fields, params }) => {
    const { isEditMode, isLoggedIn, isCancelledBookingPage, isTradePortal, getPhrase } = useStore(
        (stores: TStores) => ({
            isTradePortal: stores.layoutStore.isTradePortal,
            getPhrase: stores.layoutStore.getPhrase,
            ...(isHolidayStore(stores) && {
                isEditMode: stores.layoutStore.isEditMode,
                isLoggedIn: stores.userStore.isLoggedIn,
                isCancelledBookingPage: stores.layoutStore.isCancelledBookingPage,
            }),
        }),
    );
    const { booking } = useContext(BookingContext);
    const backgroundImage = useBookingDestImage(booking);

    if (!booking || !fields) {
        return null;
    }

    const { Title, TextAbove, AltTextAbove } = fields;
    const showLuxuryPackage = containsLuxuryPromoCode(booking?.promoCollections);
    const isTradePortalCancelledBooking = isTradePortal && booking.bookingStatus === BookingStatus.Canceled;
    const depDate = getBookingRoute(booking, RouteDirection.Outbound)?.depDate;
    const showCountdown =
        !isTradePortalCancelledBooking &&
        isSitecoreCheckboxSelected(params?.ShowCountdown) &&
        !isCancelledBookingPage &&
        depDate;
    const [region, country] = getBookingDestination(booking).split(',');

    const title = isEditMode ? Title : { value: getHeroBannerTitle(Title.value, country, region) };
    const name = booking.guests.find(g => g.isLead)?.firstName;

    const textAboveField = (showLuxuryPackage && AltTextAbove) || TextAbove;
    const textAbove = isEditMode
        ? textAboveField
        : {
              value: Tokenizer.replaceToken(textAboveField?.value, Tokens.Name, name),
          };

    return (
        <>
            <div className={styles.container} data-tid='booking-hero-banner'>
                <div className={styles.image} style={{ backgroundImage }} data-tid='booking-hero-banner-image' />
                <div
                    className={classNames(styles.contentContainer, { [styles.luxuryContent]: showLuxuryPackage })}
                    data-tid='booking-hero-banner-content'
                >
                    {(isLoggedIn || isTradePortalCancelledBooking) && (
                        <Placeholder name={PlaceholderNames.BookingHeroTop} rendering={rendering} />
                    )}

                    <div className={styles.content}>
                        <Text field={textAbove} className={styles.subtitle} tag='span' data-tid='banner-text-above' />
                        <RichTextWithLinks
                            field={title}
                            className={styles.title}
                            tag='h1'
                            dataId='booking-hero-banner-title'
                        />

                        {showCountdown && (
                            <div className={classNames(styles.countdown, 'no-print')} data-tid='hero-banner-timer'>
                                <Timer date={getDateWithoutDSTOffset(depDate)} useAbbreviation />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showLuxuryPackage && <LuxuryBar label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)} />}
        </>
    );
};

export default observer(BookingHeroBanner);
