import * as React from 'react';
import classNames from 'classnames';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import { TStores } from 'frontend/store/IStores';
import { getPriceDifferencePP } from 'frontend/utils/offer.utils';
import { getOfferRoutesUniqueId } from 'frontend/utils/route.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOffer, IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { getHolidayDates } from 'frontend/components/common/PriceGraph/priceGraphUtils';

import AlternativeFlightsList from './AlternativeFlightsList';
import FlightCard from './FlightCard';

interface IAlternativeFlightsDrawerProps extends IComponentWithDictionary {
    alterativeFlightsDate: Nullable<string>;

    drawerRef: React.RefObject<HTMLDivElement>;
    isExpanded: boolean;

    isFlightSelected: (offer: IAlternativeOffer) => boolean;
    isScreenMedium: boolean;

    isShowLessVisible: boolean;
    isShowMoreVisible: boolean;
    nextFlightIndex: number;

    nextFlightRef: React.RefObject<HTMLDivElement>;

    offer: Nullable<IAlternativeOffer>;
    onCancelChanges: () => void;
    onClickSelect: (offer: IAlternativeOffer, priceDiff: number) => void;
    onClickShowLess: () => void;
    onClickShowMore: () => void;
    onConfirmChanges: () => void;

    paginatedFlights: IAlternativeOffer[];

    priceGraphPopupVisible: boolean;
    seatsReservationNotification: JSX.Element | null;
    selectedOffer: IOffer | IAlternativeOffer;
    showLessMobileRef: React.RefObject<HTMLDivElement>;
    showMoreRef: React.RefObject<HTMLDivElement>;
    sortedFlights: IAlternativeOffer[];
}

export class AlternativeFlightsDrawer extends React.Component<IAlternativeFlightsDrawerProps> {
    constructor(props: IAlternativeFlightsDrawerProps) {
        super(props);
        makeObservable(this);
    }

    @observable private initialOffer: IOffer | IAlternativeOffer;
    @observable private otherDateFirstOffer: Nullable<IOffer | IAlternativeOffer> = null;
    private initialFlights = this.props.paginatedFlights;

    private alternativeFlightsContainerRef = React.createRef<HTMLDivElement>();

    componentDidUpdate(prevProps: IAlternativeFlightsDrawerProps) {
        if (!prevProps.isExpanded && this.props.isExpanded) {
            runInAction(() => {
                this.initialOffer = {
                    ...(this.props.selectedOffer || {}),
                    transport: {
                        ...(this.props.selectedOffer?.transport || {}),
                    },
                };
            });

            if (this.initialOffer?.date === this.props.selectedOffer.date) {
                this.props.drawerRef?.current &&
                    scrollIntoViewIfNeeded(this.props.drawerRef.current, {
                        behavior: 'smooth',
                        block: 'start',
                    });
            } else {
                this.scrollFlightsToTop();
            }
        }

        //* set new first slected offer after changing date via price graph,
        if (
            this.initialOffer &&
            this.props.selectedOffer.date !== this.initialOffer.date &&
            this.props.selectedOffer.date !== prevProps.selectedOffer.date
        ) {
            this.otherDateFirstOffer = this.props.selectedOffer;
        }
    }

    @action scrollFlightsToTop = () => {
        if (this.alternativeFlightsContainerRef.current !== null) {
            scrollIntoViewIfNeeded(this.alternativeFlightsContainerRef.current, {
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    @action onConfirmChanges = () => {
        this.initialFlights = this.props.paginatedFlights;
        this.props.onConfirmChanges();
    };

    @action onCancelChanges = () => {
        const getFlightIds = (offer: Nullable<IOffer | IAlternativeOffer>) =>
            offer?.transport?.routes.map(r => r.id).join('|') ?? '';

        if (getFlightIds(this.props.selectedOffer) !== getFlightIds(this.initialOffer)) {
            this.props.onClickSelect(this.initialOffer, 0);
        }

        this.props.onCancelChanges();
    };

    @computed get holidayDurationLabel() {
        const dates = getHolidayDates(new Date(this.props.selectedOffer.date), this.props.selectedOffer.stay);

        return `${dates.departure} - ${dates.return}`;
    }

    get isDisabled() {
        const disabled =
            this.initialOffer &&
            !!this.initialOffer.transport.routes.some(
                route =>
                    !this.props.selectedOffer!.transport.routes.some(selectedRoute => route.id === selectedRoute.id),
            );

        return !disabled;
    }

    get offers() {
        return this.props.alterativeFlightsDate !== this.props.selectedOffer.date
            ? this.initialFlights
            : this.props.paginatedFlights;
    }

    @computed get offerForFlightCard() {
        if (this.initialOffer?.date === this.props.selectedOffer.date) {
            return this.initialOffer;
        }

        return this.otherDateFirstOffer || this.props.selectedOffer;
    }

    @computed get formattedOffers() {
        const offers = (this.offers || []).filter(
            offer => getOfferRoutesUniqueId(offer) !== getOfferRoutesUniqueId(this.offerForFlightCard),
        );

        return offers;
    }

    @computed get totalFlights() {
        // EJH-14806: this.props.sortedFlights.length breaks from filtering when the selected offer isn't contained in this.offers
        return this.props.sortedFlights.filter(
            offer => getOfferRoutesUniqueId(offer) !== getOfferRoutesUniqueId(this.offerForFlightCard),
        ).length;
    }

    render() {
        return (
            <Drawer
                className={classNames(
                    'alternative-flights-drawer',
                    this.props.priceGraphPopupVisible && 'alternative-flights-drawer--hidden',
                )}
                open={this.props.isExpanded}
                containerRef={this.props.drawerRef}
            >
                <div ref={this.props.showLessMobileRef}>
                    <h3 className='alternative-flights-drawer__title'>
                        {this.props.getPhrase(SitecoreDictionary.PriceGraphLabelsAlternativeTimes)}
                    </h3>
                    <div className='alternative-flights-drawer__selected-date'>{this.holidayDurationLabel}</div>
                    {!this.props.isScreenMedium && this.props.seatsReservationNotification}
                </div>

                <div ref={this.alternativeFlightsContainerRef}>
                    <FlightCard
                        offer={this.offerForFlightCard}
                        priceDifference={getPriceDifferencePP(
                            this.offerForFlightCard.price - (this.props.offer?.price ?? 0),
                            this.offerForFlightCard.accom.unit as IUnit[],
                        )}
                        dataTid='alt-flight-card'
                        isChangeable={false}
                        isSelected={this.props.isFlightSelected(this.offerForFlightCard)}
                        onClickSelect={this.props.onClickSelect}
                    />

                    <AlternativeFlightsList
                        altRoutes={this.formattedOffers}
                        totalFlights={this.totalFlights}
                        isShowMoreVisible={this.props.isShowMoreVisible}
                        isShowLessVisible={this.props.isShowLessVisible}
                        isFlightSelected={this.props.isFlightSelected}
                        onClickShowMore={this.props.onClickShowMore}
                        onClickShowLess={this.props.onClickShowLess}
                        onClickSelect={this.props.onClickSelect}
                        showMoreRef={this.props.showMoreRef}
                        nextFlightRef={this.props.nextFlightRef}
                        nextFlightIndex={this.props.nextFlightIndex}
                        offer={this.props.offer}
                    />
                </div>

                <div className='drawer__actions'>
                    <Button isTransparent isFullWidth onClick={this.onCancelChanges} dataTid='cancel-btn'>
                        {this.props.getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                    </Button>

                    <Button
                        isFullWidth
                        onClick={this.onConfirmChanges}
                        dataTid='confirm-btn'
                        disabled={this.isDisabled}
                    >
                        {this.props.getPhrase(SitecoreDictionary.AlternativeFlightsButtonsConfirm)}
                    </Button>
                </div>
            </Drawer>
        );
    }
}

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isScreenMedium: stores.appStore.isScreenMedium,
    priceGraphPopupVisible: stores.priceGraphStore.priceGraphPopupVisible,
}))(observer(AlternativeFlightsDrawer));
