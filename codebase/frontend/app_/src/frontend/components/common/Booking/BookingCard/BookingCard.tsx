import { FC } from 'react';
import { ComponentRendering, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { inject } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { IHolidaysStores } from 'frontend/store/holidays';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import OfferCardSlider from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import PackageIcons from 'frontend/components/common/PackageIcons/PackageIcons';

import BookingCardDetails from './components/BookingCardDetails/BookingCardDetails';
import BookingCardHead from './components/BookingCardHead/BookingCardHead';
import BookingCardInfo from './components/BookingCardInfo/BookingCardInfo';
import BookingCardOptions from './components/BookingCardOptions/BookingCardOptions';
import { usePreparedBookingData } from './BookingCard.utils';

import styles from './BookingCard.module.scss';

export interface IBookingCardProps {
    booking: IBookingInfo;
    isPrevious: boolean;
    isUpcoming: boolean;
    rendering: ComponentRendering;
    PillIcon?: ISitecoreField<ISitecoreImage>;
    PillText?: ISitecoreField<string>;
}

interface IBookingCardInjectedProps {
    getPhrase: (phrase: SitecoreDictionary) => string;
    getSetting: (setting: SiteSettings) => string;
    isPaymentReminderVisible: (booking: IBookingInfo) => boolean;
}

export const BookingCard: FC<IBookingCardProps & IBookingCardInjectedProps> = ({
    booking,
    isUpcoming,
    isPrevious,
    rendering,
    isPaymentReminderVisible,
    getSetting,
    getPhrase,
    PillIcon,
    PillText,
}) => {
    const isLuxuryPackage = containsLuxuryPromoCode(booking?.promoCollections);
    const fallbackImage = cmsUrls.media(getSetting(SiteSettings.HotelFallbackImage));
    const { images } = usePreparedBookingData(booking);

    const displayLuxuryPackage = isLuxuryPackage && (isUpcoming || isPrevious);

    const bookingCardComponent = (
        <div className='hotel-card row'>
            <div className='hotel-card-img-box-wr col-lg-5'>
                <div className='img-carousel-container' data-tid='hotel-card-images'>
                    <OfferCardSlider images={images} fallbackImage={fallbackImage} showIndex />
                    {!isLuxuryPackage && PillIcon && (
                        <div className={styles.pill}>
                            <JSSImageNext field={PillIcon} />
                            <Text field={PillText} className={styles.pillText} tag='span' />
                        </div>
                    )}
                </div>
            </div>

            <div className='hotel-card-text-box col-lg-7'>
                <div
                    className={classNames(styles.hotelCardBody, styles.wrapper, {
                        [styles.fullWidth]: !isPaymentReminderVisible(booking),
                    })}
                >
                    <BookingCardHead booking={booking} />
                    <BookingCardOptions booking={booking} />
                    <BookingCardDetails booking={booking} />
                    {displayLuxuryPackage && (
                        <PackageIcons
                            className={styles.packageIcons}
                            extraLuggage={booking?.extraLuggageInfo}
                            packageIcons={booking?.hotel?.theme?.packageIcons || []}
                            transfer={booking?.transfers?.[0] || null}
                            rendering={rendering}
                            isLuxury={isLuxuryPackage}
                        />
                    )}
                    <BookingCardInfo booking={booking} isUpcoming={isUpcoming} />
                </div>
            </div>
        </div>
    );

    return isLuxuryPackage ? (
        <LuxuryWrapper label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)} wrapperClassName='card'>
            {bookingCardComponent}
        </LuxuryWrapper>
    ) : (
        <div className='card'>{bookingCardComponent}</div>
    );
};

export default inject((stores: IHolidaysStores) => ({
    isPaymentReminderVisible: stores.bookingStore.isPaymentReminderVisible,
    getSetting: stores.layoutStore.getSetting,
    getPhrase: stores.layoutStore.getPhrase,
}))(BookingCard);
