import React, { FC } from 'react';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { formatDateL10n, formatHolidayDatesRange, getDate } from 'frontend/utils/date.utils';
import { getNumberOfGuestsByCategory } from 'frontend/utils/guestsValidation';
import { isShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import { IThemePackageIcon } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SVGCalendarLined from 'frontend/components/icons-new/CalendarLined';
import SVGDepartureFilled from 'frontend/components/icons-new/DepartureFilled';
import SVGNightsLined from 'frontend/components/icons-new/NightsLined';
import SvgUserFilled from 'frontend/components/icons-new/UserFilled';
import OtherRoutes from 'frontend/components/renderings/SearchResults/components/other-routes/OtherRoutes';

import HoldBagsShortInfo from './HoldBagsShortInfo/HoldBagsShortInfo';
import BasketTransfer from './BasketTransfer';

export interface IHolidayFlightDetailsProps {
    luggageCount: number;
    night: number;
    packageIcons: Nullable<IThemePackageIcon[]>;
    routeArr: Nullable<IRoute>;
    routeDep: Nullable<IRoute>;
    transfer: Nullable<ITransfer>;
    isParentOffer?: boolean;
    isRecommendedOffer?: boolean;
    luggageText?: string;
    offer?: Nullable<IOffer>;
}

// TODO: airport names
export const HolidayFlightDetails: FC<IHolidayFlightDetailsProps> = ({
    offer,
    routeArr,
    routeDep,
    night,
    luggageCount,
    luggageText,
    packageIcons,
    isRecommendedOffer,
    isParentOffer,
    transfer,
}) => {
    const { isScreenMedium, isShortlistPage, getPhrase } = useStore(({ layoutStore, appStore }: TStores) => ({
        getPhrase: layoutStore.getPhrase,
        isScreenMedium: appStore.isScreenMedium,
        isShortlistPage: layoutStore.isShortlistPage,
    }));

    const getRoomsValue = () => {
        /* istanbul ignore next */
        if (!offer) {
            return '';
        }

        const rooms = offer.accom.unit.length;

        return rooms > 1
            ? `, ${rooms} ${getPhrase(SitecoreDictionary.GlobalsLabelsRooms)}`
            : `, ${rooms} ${getPhrase(SitecoreDictionary.GlobalsLabelsRoom)}`;
    };

    const getWhoValue = () => {
        /* istanbul ignore next */
        if (!offer) {
            return '';
        }

        const adults = offer?.accom.unit.reduce((total, room) => total + room.occupation.adults, 0);
        const children = offer?.accom.unit.reduce((total, room) => total + room.occupation.children, 0);
        const infants = offer?.accom.unit.reduce((total, room) => total + room.occupation.infants, 0);

        return getNumberOfGuestsByCategory(getPhrase, adults, children, infants);
    };

    const isHolidayDateVisible = !(isShortlistPage && offer && isShortlistOfferUnavailable(offer));

    // Display transfer details on left column if  holiday dates are not displayed
    const isTransferDetailsInLeftCol = !isHolidayDateVisible;

    const showOtherRoutes = (offer?.otherRoutes || []).length > 1 && !isRecommendedOffer && !isParentOffer;

    const isRecommendedCarousel = isRecommendedOffer || isParentOffer;
    // INS-520: offer?.date should be used for recommended carousel items when routeDep doesn't contain any values
    const departureDateString = (routeDep?.depDate || (isRecommendedCarousel ? offer?.date : '')) ?? '';
    const departureDate = getDate(departureDateString);
    const arrivalDate = getDate(routeArr?.depDate ?? '');
    const totalNights = getDurationLabel(getPhrase, night);
    const packageIconsData = isRecommendedCarousel ? packageIcons || [] : undefined;
    const depName = routeDep?.depName;

    return (
        <div className='holiday-details' data-tid='holiday-details'>
            {isScreenMedium && !isParentOffer && !isRecommendedOffer ? (
                <div className='row'>
                    <div className='holiday-details__colum col-md-6 col-12'>
                        <div className='holiday-details__item' data-tid='departure-airport'>
                            <i className='holiday-details__icon'>
                                <SVGDepartureFilled />
                            </i>
                            <span className='holiday-details__text' data-tid='departure-airport-name'>
                                {depName} ({routeDep?.depPt})
                                {showOtherRoutes && <OtherRoutes offer={offer as IOffer} />}
                            </span>
                        </div>
                        {isHolidayDateVisible && (
                            <div className='holiday-details__item' data-tid='holiday-dates'>
                                <i className='holiday-details__icon'>
                                    <SVGCalendarLined />
                                </i>
                                <span className='holiday-details__text'>
                                    {formatHolidayDatesRange(departureDate, arrivalDate)}
                                </span>
                            </div>
                        )}
                        <HoldBagsShortInfo
                            luggageCount={luggageCount}
                            luggageText={luggageText}
                            packageIcons={packageIconsData}
                            extraLuggageItems={offer?.extraLuggageInfo?.items || []}
                        />
                        {isTransferDetailsInLeftCol && (
                            <BasketTransfer transfer={transfer} packageIcons={packageIcons} />
                        )}
                    </div>
                    <div className='holiday-details__colum col-md-6 col-12'>
                        <div className='holiday-details__item' data-tid='arrival-airport'>
                            <i className='holiday-details__icon'>
                                <SVGDepartureFilled className='icon--reflect-x' />
                            </i>
                            <span className='holiday-details__text'>
                                {routeArr?.depName} ({routeArr?.depPt})
                            </span>
                        </div>

                        <div className='holiday-details__item' data-tid='nights-count'>
                            <i className='holiday-details__icon'>
                                <SVGNightsLined />
                            </i>
                            <span className='holiday-details__text'>{totalNights}</span>
                        </div>

                        {!isTransferDetailsInLeftCol && (
                            <BasketTransfer transfer={transfer} packageIcons={packageIcons} />
                        )}
                    </div>
                </div>
            ) : (
                <div className='row'>
                    <div className='holiday-details__colum col-12'>
                        <div className='holiday-details__item'>
                            <i className='holiday-details__icon'>
                                <SVGDepartureFilled />
                            </i>
                            <span className='holiday-details__text' data-tid='holiday-info'>
                                {depName}
                                {depName ? ' - ' : ' '}
                                {isHolidayDateVisible &&
                                    `${formatDateL10n(
                                        departureDate,
                                        DATE_FORMATS.dateWithAbbrMonthName,
                                    )} - ${totalNights}`}
                            </span>
                        </div>
                        {showOtherRoutes && <OtherRoutes offer={offer as IOffer} className='mobile' />}
                        {isRecommendedOffer && offer && (
                            <div className='holiday-details__item' data-tid='room-type'>
                                <i className='holiday-details__icon'>
                                    <SvgUserFilled />
                                </i>

                                {getWhoValue()}
                                {getRoomsValue()}
                            </div>
                        )}
                        <HoldBagsShortInfo
                            luggageCount={luggageCount}
                            luggageText={luggageText}
                            extraLuggageItems={offer?.extraLuggageInfo?.items || []}
                            packageIcons={packageIconsData}
                        />
                        {!isParentOffer && !isRecommendedOffer && (
                            <BasketTransfer transfer={transfer} packageIcons={packageIcons} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default observer(HolidayFlightDetails);
