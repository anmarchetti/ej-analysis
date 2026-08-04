import * as React from 'react';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { MarketStore } from 'frontend/store/base';
import { TStores } from 'frontend/store/IStores';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { distanceInfo, distanceTextFromSitecore } from 'frontend/utils/getHotelLocation';
import { isDefined } from 'frontend/utils/object.utils';
import { getAvailabilityFromOffer } from 'frontend/utils/offer.utils';
import { isShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import { stringToTitleCase } from 'frontend/utils/string.utils';
import { getRoomsUrgencyMessage } from 'frontend/utils/urgencyMessage.utils';
import { IBoardType, IClosestFacility, IHotelType, IRoomType, ITheme } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ISelectOption } from 'models/data/ISelectOption';
import { MarketCode } from 'models/data/MarketSettings';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { HolidayTypes } from 'models/enum/HolidayThemes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { JSSImage } from 'frontend/components/common/JSSImage';
import Pill from 'frontend/components/common/Pills/Pill/Pill';
import { IComponentWithRerenderProps, withRerender } from 'frontend/components/hoc/withRerender';
import SVGCalendarLined from 'frontend/components/icons-new/CalendarLined';
import SVGDepartureFilled from 'frontend/components/icons-new/DepartureFilled';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import SVGLocationPinFilled from 'frontend/components/icons-new/LocationPinFilled';
import TimeRunningOut from 'frontend/components/icons-new/TimeRunningOut';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';

import OtherRoutes from './other-routes/OtherRoutes';
import ViewAltBoardsPopupCTA from './ViewAltBoardsLink/ViewAltBoardsPopupCTA';

import styles from './OfferCardOptions.module.scss';

export interface IOfferCardOptionsProps extends IComponentWithDictionary, IComponentWithRerenderProps {
    alternativeFlightsDefaultSort: AlternativeFlightsSortBy;
    alternativeFlightsSortOrders: ISelectOption[];
    boardType: IBoardType;
    closestFacility: Nullable<IClosestFacility>;
    getFormattedNumber: MarketStore['getFormattedNumber'];
    getSetting: (key: string) => number;
    isAlternativeBoardsEnabled: boolean;
    isApplySpecialFilter: (key: string, pageName: string) => boolean;
    isHotelDetailsBookPage: boolean;
    isPromoPage: boolean;
    isScreenLessMedium: boolean;
    isShortlistPage: boolean;
    marketCode: string;
    night: number;
    pageName: string;
    roomType: IRoomType;
    routeArr: IRoute;
    routeDep: IRoute;
    holidayTheme?: Nullable<ITheme>;
    holidayType?: Nullable<IHotelType>;
    isABVariantTest?: boolean;
    isOfferCardsABTesting?: boolean;
    isShortlistHotelType?: boolean;
    isUrgencyMessageVisible?: boolean;
    offer?: Nullable<IOffer>;
}

export class OfferCardOptions extends React.Component<IOfferCardOptionsProps> {
    get isShortlistOfferUnavailable(): boolean {
        return !!(this.props.isShortlistPage && this.props.offer && isShortlistOfferUnavailable(this.props.offer));
    }

    get showOtherRoutes(): boolean {
        if (this.props.isPromoPage) {
            return (
                !this.props.isApplySpecialFilter(SiteSettings.HideOtherRoutesInPages, this.props.pageName) &&
                (this.props.offer?.otherRoutes || []).length > 1
            );
        }

        return (this.props.offer?.otherRoutes || []).length > 1;
    }

    get showOtherBoards(): boolean {
        return this.props.isAlternativeBoardsEnabled && (this.props.offer?.altBoards ?? []).length > 0;
    }

    get formattedDate(): string {
        return formatDateL10n(this.props.routeDep.depDate, DATE_FORMATS.DayOfWeekDayMonthYearAbbr);
    }

    get totalNights(): string {
        return getDurationLabel(this.props.getPhrase, this.props.night);
    }

    private get distanceText(): string {
        const { closestFacility, getPhrase, holidayTheme, getFormattedNumber } = this.props;
        const distanceTextFromSiteCore = distanceTextFromSitecore(closestFacility, getPhrase, holidayTheme);

        return distanceInfo(closestFacility, distanceTextFromSiteCore, false, getFormattedNumber);
    }

    renderBoardType = (): JSX.Element | null => {
        const { boardType } = this.props;

        return boardType && (boardType.title || boardType.name) ? (
            <div className='holiday-details__item' data-tid='board-type'>
                <i className='holiday-details__icon-v2'>
                    <BoardTypeIcon iconUrl={boardType.iconUrl} />
                </i>
                <span className='holiday-details__text-v2'>
                    <span>{boardType.title || boardType.name}</span>
                    {this.showOtherBoards && !this.props.isShortlistPage && (
                        <ViewAltBoardsPopupCTA
                            offer={this.props.offer as IOffer}
                            isOfferCardsABTesting={this.props.isOfferCardsABTesting}
                        />
                    )}
                </span>
            </div>
        ) : null;
    };

    renderRoomType = (): JSX.Element | null => {
        const {
            roomType,
            offer,
            marketCode,
            isABVariantTest,
            isUrgencyMessageVisible,
            wasRerendered,
            isScreenLessMedium,
            getPhrase,
            isHotelDetailsBookPage,
            getSetting,
        } = this.props;

        const label = roomType ? roomType.title || roomType.name : null;
        const isUKMarket = marketCode === MarketCode.UK;
        const avail = getAvailabilityFromOffer(offer);

        const title = getRoomsUrgencyMessage(avail, getPhrase, getSetting);
        const text = getPhrase(
            isHotelDetailsBookPage
                ? SitecoreDictionary.HotelDetailsLabelsHurryTooltip
                : SitecoreDictionary.SearchResultsLabelsHurryTooltip,
        );

        return label ? (
            <div className='holiday-details__item' data-tid='room-type'>
                <i className='holiday-details__icon-v2'>
                    <SVGHotelBedFilled />
                </i>
                <div className='holiday-details__text-v2'>
                    {stringToTitleCase(`${label}`)}

                    {/*EHD-538: Urgency Message Wrapper need to improve analytics for Optimazely experiment, this wrapper will removed when the AB experiment ends*/}
                    {wasRerendered && !isScreenLessMedium && isUrgencyMessageVisible && title && (
                        <span className={classNames('urgency-message-wrapper', styles.urgentPillWrapper)}>
                            {(isUKMarket || isABVariantTest) && (
                                <Pill
                                    contentClass={classNames(styles.urgentPillContent, styles.priority)}
                                    icon={<TimeRunningOut />}
                                    title={title}
                                    text={text}
                                />
                            )}
                        </span>
                    )}
                </div>
            </div>
        ) : null;
    };

    renderTheme = (): JSX.Element | null => {
        const { holidayType } = this.props;

        /**Dont show Handpicked and Other according comments to EJH-13009 */
        if (holidayType && holidayType.name !== HolidayTypes.Handpicked && holidayType.name !== HolidayTypes.Other) {
            return (
                <div className='holiday-details__item' data-tid='holiday-type'>
                    {!!holidayType.icon && (
                        <i className='holiday-details__icon-v2'>
                            <JSSImage field={{ value: { src: holidayType.icon } }} />
                        </i>
                    )}

                    <span className={classNames('holiday-details__text-v2 pe-2', styles.pillWrapper)}>
                        <Pill
                            ellipsis
                            contentClass={classNames(styles.pillContent, styles.priority)}
                            titleClass={classNames(styles.pillText, styles.priority)}
                            title={holidayType.typeAndThemeTitle}
                            text={this.props.holidayType?.description}
                        />
                    </span>
                </div>
            );
        }

        return null;
    };

    renderClosestFacility = (): JSX.Element | null => {
        if (isDefined(this.props.closestFacility?.distance) && this.distanceText) {
            return (
                <div className='holiday-details__item' data-tid='distance'>
                    <i className='holiday-details__icon-v2'>
                        <SVGLocationPinFilled className='icon--reflect-x' />
                    </i>
                    <span className='holiday-details__text-v2'>{this.distanceText}</span>
                </div>
            );
        }

        return null;
    };

    renderHotelShortlistDetails = (): JSX.Element => (
        <>
            {this.renderTheme()}
            {this.renderClosestFacility()}
        </>
    );

    render(): JSX.Element {
        const { routeArr, routeDep, isScreenLessMedium, isShortlistHotelType, offer } = this.props;

        if (isShortlistHotelType) {
            return this.renderHotelShortlistDetails();
        }

        return (
            <>
                {isScreenLessMedium && (this.renderTheme() || this.renderClosestFacility())}
                {!this.props.isOfferCardsABTesting && this.renderRoomType()}
                {this.renderBoardType()}
                {this.props.isOfferCardsABTesting && this.renderRoomType()}

                {isScreenLessMedium ? (
                    <div className='holiday-details__item' data-tid='departure-airport'>
                        <i className='holiday-details__icon-v2'>
                            <SVGDepartureFilled />
                        </i>
                        <span className='holiday-details__text-v2' data-tid='departure-airport-name'>
                            <span>
                                {routeDep.depName}
                                {!this.isShortlistOfferUnavailable && ` - ${this.formattedDate} - ${this.totalNights}`}
                            </span>
                            {this.showOtherRoutes && (
                                <OtherRoutes
                                    offer={offer as IOffer}
                                    isOfferCardsABTesting={this.props.isOfferCardsABTesting}
                                    alternativeFlightsSortOrders={this.props.alternativeFlightsSortOrders}
                                    alternativeFlightsDefaultSort={this.props.alternativeFlightsDefaultSort}
                                />
                            )}
                        </span>
                    </div>
                ) : (
                    <>
                        <div className='holiday-details__item' data-tid='departure-airport'>
                            <i className='holiday-details__icon-v2'>
                                <SVGDepartureFilled />
                            </i>
                            <span className='holiday-details__text-v2' data-tid='departure-airport-name'>
                                <span>
                                    {routeDep.depName} ({routeDep.depPt})
                                </span>
                                {this.showOtherRoutes && (
                                    <OtherRoutes
                                        offer={offer as IOffer}
                                        isOfferCardsABTesting={this.props.isOfferCardsABTesting}
                                        alternativeFlightsSortOrders={this.props.alternativeFlightsSortOrders}
                                        alternativeFlightsDefaultSort={this.props.alternativeFlightsDefaultSort}
                                    />
                                )}
                            </span>
                        </div>

                        <div className='holiday-details__item' data-tid='arrival-airport'>
                            <i className='holiday-details__icon-v2'>
                                <SVGDepartureFilled className='icon--reflect-x' />
                            </i>
                            <span className='holiday-details__text-v2'>
                                {routeArr.depName} ({routeArr.depPt})
                            </span>
                        </div>
                    </>
                )}

                {!this.props.isScreenLessMedium && !this.isShortlistOfferUnavailable && (
                    <div className='holiday-details__item' data-tid='holiday-dates'>
                        <i className='holiday-details__icon-v2'>
                            <SVGCalendarLined />
                        </i>
                        <div className='holiday-details__text-v2'>
                            {this.formattedDate}
                            <br />
                            {this.totalNights}
                        </div>
                    </div>
                )}

                {!isScreenLessMedium && (this.renderTheme() || this.renderClosestFacility())}
            </>
        );
    }
}

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isPromoPage: stores.layoutStore.isPromoPage,
    pageName: stores.layoutStore.pageName,
    isApplySpecialFilter: stores.layoutStore.isApplySpecialFilter,
    isScreenLessMedium: stores.appStore.isScreenLessMedium,
    isAlternativeBoardsEnabled: stores.layoutStore.isAlternativeBoardsEnabled,
    getFormattedNumber: stores.marketStore.getFormattedNumber,
    marketCode: stores.marketStore.marketCode,
    isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
    getSetting: stores.layoutStore.getSetting,
}))(withRerender(observer(OfferCardOptions)));
