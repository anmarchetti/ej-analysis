import * as React from 'react';
import classNames from 'classnames';
import { action, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { getDaysDifference } from 'frontend/utils/date.utils';
import { getPromoPageDates } from 'frontend/utils/promoPageDates';
import { IHolidayWithConfidenceFields } from 'models/data/IHolidayWithConfidence';
import { IOffer } from 'models/data/IOffer';
import { isLoadingStatus } from 'models/enum/DataStatus';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

import HolidayWithConfidencePopup from './components/HolidayWithConfidencePopup';

import styles from './HolidayWithConfidence.module.scss';

export interface IHolidayWithConfidenceProps extends ISitecoreComponent<IHolidayWithConfidenceFields> {
    isFlexible: boolean;
    isHotelDetailsBookPage: boolean;
    isPromoPage: boolean;
    isScreenMedium: boolean;
    isSearchResultsPage: boolean;
    offers: IOffer[];
    searchDepartureDate: Date | null;
    selectedOfferDate: Date | null;
    isLoading?: boolean;
}

const MODULE_ICON_SIZE = 25;

class HolidayWithConfidence extends React.Component<IHolidayWithConfidenceProps> {
    constructor(props: IHolidayWithConfidenceProps) {
        super(props);
        makeObservable(this);
    }

    @observable isShowPopup: boolean = false;

    @action togglePopup = (state: boolean) => {
        this.isShowPopup = state;
    };

    get departureDate() {
        if (this.props.isHotelDetailsBookPage) {
            return this.props.selectedOfferDate;
        }

        return this.props.searchDepartureDate;
    }

    get isMixedOffers() {
        let isMoreDays;
        let isLessDays;

        return !!this.props.offers.find(offer => {
            if (
                !isMoreDays &&
                !this.isDepartureClosureThanDaysSeparator(
                    new Date(offer.date),
                    +(this.props.fields?.DaysSeparator?.value || 0),
                )
            ) {
                isMoreDays = true;
            }

            if (
                !isLessDays &&
                this.isDepartureClosureThanDaysSeparator(
                    new Date(offer.date),
                    +(this.props.fields?.DaysSeparator?.value || 0),
                )
            ) {
                isLessDays = true;
            }

            return isMoreDays && isLessDays;
        });
    }

    get moduleDependedOnDate() {
        if (!this.props.fields) {
            return null;
        }

        return this.departureDate &&
            this.isDepartureClosureThanDaysSeparator(this.departureDate, +this.props.fields.DaysSeparator.value)
            ? this.props.fields.Before
            : this.props.fields.After;
    }

    get moduleForRender() {
        if (!this.props.fields) {
            return null;
        }

        const isSearchPageWithMixedOffers =
            this.props.isSearchResultsPage && this.props.isFlexible && this.isMixedOffers;
        const isPromoPageWithMixedOffers = this.props.isPromoPage && this.isMixedOffers;

        if (isSearchPageWithMixedOffers || isPromoPageWithMixedOffers) {
            return this.props.fields.Before;
        }

        return this.moduleDependedOnDate;
    }

    isDepartureClosureThanDaysSeparator = (date: Date, daysSeparator: number) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return getDaysDifference(date, today) <= daysSeparator;
    };

    render() {
        if (
            !this.departureDate ||
            !this.props.fields?.DaysSeparator ||
            !+this.props.fields.DaysSeparator.value ||
            !this.moduleForRender
        ) {
            return null;
        }

        if (this.props.isLoading) {
            return (
                <div
                    className={classNames('placeholder-shimmer', styles.shimmer)}
                    data-tid='confidence-module-shimmer'
                />
            );
        }

        return (
            <>
                <div className='confidence-module'>
                    <JSSImageNext
                        field={this.moduleForRender.fields.ModuleIcon}
                        className='confidence-module__icon'
                        width={MODULE_ICON_SIZE}
                        height={MODULE_ICON_SIZE}
                    />

                    <div className='text-content-wrapper'>
                        <div>
                            <p className='confidence-module__title'>{this.moduleForRender.fields.ModuleTitle.value}</p>
                            <div className='confidence-module__text'>
                                <span>{this.moduleForRender.fields.ModuleText.value}</span>
                                {!this.props.isScreenMedium && this.moduleForRender.fields.ModuleLinkLabel.value && (
                                    <Button
                                        removeDefaultClass
                                        className='confidence-module__link'
                                        onClick={() => this.togglePopup(true)}
                                    >
                                        <span>{this.moduleForRender.fields.ModuleLinkLabel.value}</span>
                                        <IconChevronRight />
                                    </Button>
                                )}
                            </div>
                        </div>
                        {this.props.isScreenMedium && this.moduleForRender.fields.ModuleLinkLabel.value && (
                            <Button
                                removeDefaultClass
                                className='confidence-module__link'
                                onClick={() => this.togglePopup(true)}
                            >
                                <span>{this.moduleForRender.fields.ModuleLinkLabel.value}</span>
                                <IconChevronRight />
                            </Button>
                        )}
                    </div>

                    <HolidayWithConfidencePopup
                        fields={this.moduleForRender.fields}
                        togglePopup={this.togglePopup}
                        id={this.moduleForRender.id}
                        isShowPopup={this.isShowPopup}
                    />
                </div>
            </>
        );
    }
}

const ConnectedHolidayWithConfidence = inject((stores: TStores) => ({
    searchDepartureDate:
        stores.bookingStore.from ||
        stores.searchStore.searchWhen.from ||
        getPromoPageDates(stores.layoutStore.layout)?.startDate ||
        null,
    selectedOfferDate: stores.bookingStore.departureDate,
    isFlexible: stores.searchStore.searchWhen.isFlexible,
    isPromoPage: stores.layoutStore.isPromoPage,
    isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
    isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
    offers: stores.hotelsStore.offers,
    isScreenMedium: stores.appStore.isScreenMedium,
    isLoading: isLoadingStatus(stores.hotelsStore.status),
}))(observer(class WrappedHolidayWithConfidence extends HolidayWithConfidence {}));

export default ConnectedHolidayWithConfidence;
