import { FC } from 'react';
import classNames from 'classnames';

import { TrailingZeroDisplay } from 'code/currency';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { IFastTrackInfoFields } from 'frontend/components/common/Booking/FastTrackInfo/FastTrackInfo';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import FormattedMoney from 'frontend/components/common/FormattedMoney/FormattedMoney';
import HolidaySummary from 'frontend/components/common/HolidaySummary/HolidaySummary';
import { IAirportParkingInfoFields } from 'frontend/components/common/HolidaySummaryAirportParking/HolidaySummaryAirportParking';
import SvgHotelLargeLined from 'frontend/components/icons-new/HotelLargeLined';
import parentStyles from 'frontend/components/renderings/HotelSummary/HotelSummary.module.scss';

import styles from './HotelSummaryDetails.module.scss';

export type THotelSummaryDetailsProps = {
    booking: IBookingInfo;
    cabinBagsInfoFields: ICabinBagsInfoFields;
    luggageInfoFields: ILuggageInfoFields;
    priceTitle: string;
    title: string;
    airportParkingInfoFields?: IAirportParkingInfoFields;
    fastTrackInfoFields?: IFastTrackInfoFields;
    isLuxuryPackage?: boolean;
    isTitleIconShown?: boolean;
    selectedSeats?: ISelectedSeat[];
};

const HotelSummaryDetails: FC<THotelSummaryDetailsProps> = ({
    title,
    booking,
    luggageInfoFields,
    cabinBagsInfoFields,
    fastTrackInfoFields,
    airportParkingInfoFields,
    priceTitle,
    isTitleIconShown,
    selectedSeats,
    isLuxuryPackage,
}) => (
    <>
        {!!title && (
            <div className={styles.titleWrapper}>
                {isTitleIconShown && <SvgHotelLargeLined className={styles.hotelIcon} />}
                <h2 className={parentStyles.title} data-tid='hotel-summary-drawer-title'>
                    {title}
                </h2>
            </div>
        )}

        <HolidaySummary
            booking={booking}
            flights={booking.package.transport}
            transfer={booking.transfers[0]}
            luggageInfoFields={luggageInfoFields}
            cabinBagsInfoFields={cabinBagsInfoFields}
            fastTrackInfoFields={fastTrackInfoFields}
            airportParkingInfoFields={airportParkingInfoFields}
            containerClassName={styles.summaryContainer}
            dataTidPrefix='hotel-summary-drawer-full-info'
            selectedSeats={selectedSeats}
            isLuxuryPackage={isLuxuryPackage}
        />
        <div className={styles.priceBlock}>
            {!!priceTitle && (
                <div className={styles.priceText} data-tid='hotel-summary-drawer-price-title'>
                    {priceTitle}
                </div>
            )}
            <div>
                <span
                    className={classNames('price-big', styles.priceText)}
                    data-cs-mask
                    data-tid='hotel-summary-drawer-price'
                >
                    <FormattedMoney
                        amount={booking.paymentInfo.totalPrice}
                        className='price-big__subtext'
                        options={{
                            currency: booking.paymentInfo.currency,
                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        }}
                    />
                </span>
            </div>
        </div>
    </>
);

export default HotelSummaryDetails;
