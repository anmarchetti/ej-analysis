import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { Guid } from 'guid-typescript';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import scrollIntoViewIfNeeded, { Options } from 'scroll-into-view-if-needed';

import settings from 'code/settings';
import { IChangeFlightsProps } from 'frontend/store/holidays/booking/BookingStore';
import { TStores } from 'frontend/store/IStores';
import { getPriceDifferencePP } from 'frontend/utils/offer.utils';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IAnchorParameters } from 'models/data/IAnchorParameters';
import { IFilterOrderSetting, ITimeFilterOptionSetting } from 'models/data/IFilters';
import { IOffer, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { TAlternativeFlightsSortOrderItem } from 'models/enum/AlternativeFlightsSortBy';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import { IAirportCountry } from 'models/sitecore/IAirportsData';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import PriceChangeBanner from 'frontend/components/common/PriceChangeBanner/PriceChangeBanner';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';

import AlternativeFlightsDrawer from './components/AlternativeFlightsDrawer';
import AlternativeFlightsList from './components/AlternativeFlightsList';
import FlightCard from './components/FlightCard';
import { FlightShimmer } from './components/FlightShimmer';

export interface IAlternativeFlightsFields extends IAlternativeFlightsFiltersFields {
    ReservationNotificationDescription: ISitecoreField<string>;
    ReservationNotificationTitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

interface IAlternativeFlightsFiltersFields {
    FiltersOrder: IFilterOrderSetting[];
    SortDefault: TAlternativeFlightsSortOrderItem;
    SortOrder: TAlternativeFlightsSortOrderItem[];
    TimeFilters: ITimeFilterOptionSetting[];
}

export interface IAlternativeFlightsParams extends IAnchorParameters {
    IsExpanded: TSitecoreCheckboxValue;
}

export interface IAlternativeFlightsProps
    extends ISitecoreComponent<
            { airportsGroups: IAirportCountry[]; data: IAlternativeFlightsFields },
            IAlternativeFlightsParams
        >,
        IComponentWithDictionary {
    alterativeFlightsDate: Nullable<string>;
    alternativeFlights: IAlternativeOffer[];
    currentOffer: IAlternativeOffer | undefined;
    fetchOfferAndReloadPage: (force: boolean) => Promise<void>;
    flights: IAlternativeOffer[];
    initFlightsFilters: (
        orderSettings: IFilterOrderSetting[],
        timeOptionsSettings: ITimeFilterOptionSetting[],
        airports: IAirportCountry[],
        sortOrder: Nullable<TAlternativeFlightsSortOrderItem[]>,
        sortDefault: Nullable<TAlternativeFlightsSortOrderItem>,
    ) => void;
    isFailedToLoadFlights: boolean;
    isFailedToLoadOffer: boolean;
    isLoadingFlights: boolean;
    isLoadingOffer: boolean;
    isLoadingOfferForNewDate: boolean;
    isScreenExtraSmall: boolean;
    offer: Nullable<IOfferWithoutAltBoards>;
    onChangeFlight: ({
        offer,
        priceDiff,
        reloadOffer,
        isPriceGraphEventTarget,
        board,
        rooms,
        isExt,
        disableLoadAlternativeFlights,
    }: IChangeFlightsProps) => Promise<void>;
    originalFlightsOrdering: string[];
    resetOriginals: () => void;
    setFlights: () => void;
    setShowFlights: (value: number) => void;
    showFlights: number;
    sortAndFilterFlights: (flights: IAlternativeOffer[]) => IAlternativeOffer[];
}

export interface ISelectOfferOnPriceGraphProps {
    newDate: Date;
    board?: string;
    handleError?: () => void;
    inboundRouteId?: string;
    newAccommodationId?: string;
    outboundRouteId?: string;
    rooms?: IQueryRoom[];
}

const MOBILE_OFFSET_TOP = 72;

export class AlternativeFlights extends React.Component<IAlternativeFlightsProps> {
    private showMoreRef: React.RefObject<HTMLDivElement> = React.createRef();
    private showLessRef: React.RefObject<HTMLDivElement> = React.createRef();
    private showLessMobileRef: React.RefObject<HTMLDivElement> = React.createRef();
    private flightsSectionRef: React.RefObject<HTMLDivElement> = React.createRef();
    private drawerRef: React.RefObject<HTMLDivElement> = React.createRef();
    private nextFlightRef: React.RefObject<HTMLDivElement> = React.createRef();
    @observable private isExpanded: boolean = this.props.isScreenExtraSmall
        ? false
        : isSitecoreCheckboxSelected(this.props.params?.IsExpanded);

    @observable private nextFlightsIndex: number = 0;
    @observable private prevFlightsList: IAlternativeOffer[] = [];

    @observable private isReloadingPage: boolean = false;

    constructor(props: IAlternativeFlightsProps) {
        super(props);
        makeObservable(this);
    }

    get needResetOriginals(): boolean | null | undefined {
        return (
            !this.props.isLoadingFlights &&
            this.props.originalFlightsOrdering.length === 0 &&
            this.props.offer &&
            this.props.alternativeFlights.length > 0
        );
    }

    @computed get sortedFlights(): IAlternativeOffer[] {
        const [_desktopSeparateCardFlight, ...alternativeFlights] = this.props.flights;
        const sortedList = this.props.sortAndFilterFlights(
            this.props.isScreenExtraSmall ? [...this.props.flights] : alternativeFlights,
        );

        return this.moveSelectedFlightToTopOfList(sortedList);
    }

    @computed get paginatedFlights(): IAlternativeOffer[] {
        return this.sortedFlights.slice(0, this.props.showFlights);
    }

    @computed get isShowMoreVisible(): boolean {
        return (
            this.sortedFlights.length > settings.AlternativeFlights.FirstPageFlightsNumber &&
            this.paginatedFlights.length < this.sortedFlights.length
        );
    }

    @computed get isShowLessVisible(): boolean {
        return (
            this.sortedFlights.length > settings.AlternativeFlights.FirstPageFlightsNumber &&
            this.paginatedFlights.length === this.sortedFlights.length
        );
    }

    get offerForFlightCard(): IOffer | IAlternativeOffer {
        return (this.props.isScreenExtraSmall && this.props.offer) || this.props.flights[0];
    }

    get isOriginalFlightChangeable(): boolean {
        return this.paginatedFlights.length > 0 && (!this.isExpanded || this.props.isScreenExtraSmall);
    }

    get sectionId(): string {
        return this.props.params?.Anchor || Guid.create().toString();
    }

    get altRoutes(): IAlternativeOffer[] {
        return this.props.isLoadingOffer && this.prevFlightsList.length && !this.props.isScreenExtraSmall
            ? this.prevFlightsList
            : this.paginatedFlights;
    }

    get priceChangeBanner(): JSX.Element {
        const { fields } = this.props;

        return (
            <PriceChangeBanner
                ReservationNotificationDescription={fields?.data?.ReservationNotificationDescription}
                ReservationNotificationTitle={fields?.data?.ReservationNotificationTitle}
            />
        );
    }

    get isHidden(): boolean {
        return (
            !this.props.offer ||
            this.props.isFailedToLoadOffer ||
            (!this.props.isFailedToLoadFlights &&
                !this.props.isLoadingOfferForNewDate &&
                !(this.props.flights?.length > 0 || this.paginatedFlights?.length > 0))
        );
    }

    componentDidMount(): void {
        if (this.needResetOriginals) {
            this.props.resetOriginals();
        }

        this.initFilters();
    }

    componentDidUpdate(prevProps: IAlternativeFlightsProps): void {
        // Re-init filters and original flights, if offer was reset.
        // (e.g. new package is opened from the map or bd4 carousel (EJH-15057))
        if (!prevProps.offer && this.props.offer && this.props.originalFlightsOrdering.length > 0) {
            this.initFilters();
            this.props.resetOriginals();
        }

        if (this.needResetOriginals) {
            this.props.resetOriginals();
        }

        if (
            this.props.alternativeFlights !== prevProps.alternativeFlights &&
            this.props.originalFlightsOrdering.length > 0 &&
            !this.props.isLoadingOfferForNewDate
        ) {
            this.props.setFlights();
        }

        if (this.props.isScreenExtraSmall !== prevProps.isScreenExtraSmall) {
            // use timeout for correct unlock of body scroll on window resize
            setTimeout(() => {
                this.toggleFlightsSection(!this.props.isScreenExtraSmall);
            });
        }
    }

    @action initFilters = (): void => {
        this.props.initFlightsFilters(
            this.props.fields?.data?.FiltersOrder || [],
            this.props.fields?.data?.TimeFilters || [],
            this.props.fields?.airportsGroups || [],
            this.props.fields?.data?.SortOrder,
            this.props.fields?.data?.SortDefault,
        );
    };

    @action onChangeFlightClick = (offer: IAlternativeOffer, priceDifference: number): void => {
        this.prevFlightsList = this.paginatedFlights;
        this.props.onChangeFlight({ offer, priceDiff: priceDifference });
    };

    isFlightSelected = (offerToCheck: IAlternativeOffer): boolean => {
        const result = !offerToCheck.transport.routes.some(
            route => !this.props.offer?.transport.routes.some(selectedRoute => route.id === selectedRoute.id),
        );

        return result;
    };

    @action showMore = (): void => {
        // Don't include the first flight on mobile (it's shown as a separate flight card inside drawer)
        this.nextFlightsIndex = this.props.showFlights - (this.props.isScreenExtraSmall ? 1 : 0);
        this.props.setShowFlights(this.sortedFlights.length);
        setTimeout(() => {
            const node = this.nextFlightRef?.current || this.showMoreRef?.current;

            if (node) {
                scrollIntoViewIfNeeded(node, {
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        });
    };

    @action showLess = (): void => {
        const node = this.props.isScreenExtraSmall ? this.showLessMobileRef.current : this.showLessRef.current;

        if (node) {
            scrollIntoViewIfNeeded(node, {
                behavior: 'smooth',
                block: 'center',
            });
        }

        runInAction(() => {
            this.props.setShowFlights(settings.AlternativeFlights.FirstPageFlightsNumber);
        });
    };

    @action toggleFlightsSection = (state: boolean): boolean => (this.isExpanded = state);

    private getScrollOptionsWithOffset = (): Options => ({
        block: 'start',
        behavior: actions =>
            actions.forEach(({ el, top }) => {
                el.scrollTop = top - MOBILE_OFFSET_TOP;
            }),
    });

    @action confirmChanges = (): void => {
        this.isReloadingPage = true;
        this.toggleFlightsSection(false);
        this.props.fetchOfferAndReloadPage(true).then(() => {
            setTimeout(() => {
                if (this.flightsSectionRef.current) {
                    this.isReloadingPage = false;
                    scrollIntoViewIfNeeded(this.flightsSectionRef.current, this.getScrollOptionsWithOffset());
                }
            });
        });
    };

    @action cancelChanges = (): void => {
        this.toggleFlightsSection(false);

        setTimeout(() => {
            this.flightsSectionRef.current &&
                scrollIntoViewIfNeeded(this.flightsSectionRef.current, this.getScrollOptionsWithOffset());
        });
    };

    private readonly moveSelectedFlightToTopOfList = (flights: IAlternativeOffer[]): IAlternativeOffer[] => {
        const indexOfSelected = flights.findIndex(flight => this.isFlightSelected(flight));

        if (indexOfSelected !== -1 && !this.props.isScreenExtraSmall) {
            const [selected] = flights.splice(indexOfSelected, 1);
            flights.unshift(selected);
        }

        return flights;
    };

    renderContent = (): React.ReactNode => {
        const { fields } = this.props;

        return (
            <div data-tid='alternative-flights-content'>
                <div ref={this.showLessRef} className='step__header'>
                    {fields?.data?.Title && <Text field={fields.data.Title} tag='h2' className='step__title' />}
                </div>

                {this.props.isFailedToLoadFlights ? (
                    <ErrorMessage
                        icon={<SVGWarningFilled />}
                        message={this.props.getPhrase(SitecoreDictionary.AlternativeFlightsLabelsErrorWhileLoading)}
                    />
                ) : (
                    this.props.flights.length > 0 && (
                        <>
                            {this.props.isLoadingFlights ? (
                                <div className='loading-shimmers mt-0'>
                                    <FlightShimmer />
                                </div>
                            ) : (
                                <FlightCard
                                    offer={this.offerForFlightCard}
                                    priceDifference={getPriceDifferencePP(
                                        this.offerForFlightCard.price - (this.props.currentOffer?.price ?? 0),
                                        this.offerForFlightCard.accom.unit as IUnit[],
                                    )}
                                    dataTid='primary-flight-card'
                                    isSelected={this.isFlightSelected(this.offerForFlightCard)}
                                    isChangeable={this.isOriginalFlightChangeable}
                                    isLoadingOffer={this.props.isLoadingOffer}
                                    onClickChange={() => this.toggleFlightsSection(true)}
                                    onClickSelect={this.onChangeFlightClick}
                                />
                            )}

                            {/* Hidden by special request: http://jra.europe.easyjet.local/browse/EJH-5550 */}
                            {/* {
                                this.paginatedFlights.length === 0 &&
                                <ErrorMessage
                                    icon={<SVGWarningFilled />}
                                    message={this.props.getPhrase(SitecoreDictionary.AlternativeFlightsLabelsNoFlight)}
                                    IsNotification
                                    description=' '
                                />
                            } */}
                        </>
                    )
                )}

                {this.props.isLoadingFlights && !this.props.isScreenExtraSmall && (
                    <div className='loading-shimmers'>
                        <FlightShimmer />
                        <FlightShimmer />
                    </div>
                )}

                {!this.props.isLoadingFlights &&
                    !this.props.isFailedToLoadFlights &&
                    this.props.flights.length > 0 &&
                    !this.props.isScreenExtraSmall &&
                    this.isExpanded && (
                        <AlternativeFlightsList
                            altRoutes={this.altRoutes}
                            totalFlights={this.sortedFlights.length}
                            isShowMoreVisible={this.isShowMoreVisible}
                            isShowLessVisible={this.isShowLessVisible}
                            isFlightSelected={this.isFlightSelected}
                            onClickShowMore={this.showMore}
                            onClickShowLess={this.showLess}
                            onClickSelect={this.onChangeFlightClick}
                            showMoreRef={this.showMoreRef}
                            nextFlightIndex={this.nextFlightsIndex}
                            nextFlightRef={this.nextFlightRef}
                            offer={this.props.currentOffer}
                            seatsReservationNotification={this.priceChangeBanner}
                        />
                    )}

                {(this.props.isLoadingOfferForNewDate || this.props.flights.length > 0) &&
                    !this.props.isFailedToLoadFlights &&
                    this.props.isScreenExtraSmall && (
                        <AlternativeFlightsDrawer
                            isExpanded={this.isExpanded}
                            drawerRef={this.drawerRef}
                            showLessMobileRef={this.showLessMobileRef}
                            showMoreRef={this.showMoreRef}
                            isShowMoreVisible={this.isShowMoreVisible}
                            isShowLessVisible={this.isShowLessVisible}
                            paginatedFlights={this.paginatedFlights}
                            isFlightSelected={this.isFlightSelected}
                            selectedOffer={this.offerForFlightCard}
                            onClickSelect={(offer, priceDiff): Promise<void> =>
                                this.props.onChangeFlight({ offer, priceDiff, reloadOffer: false })
                            }
                            onCancelChanges={this.cancelChanges}
                            onConfirmChanges={this.confirmChanges}
                            onClickShowMore={this.showMore}
                            onClickShowLess={this.showLess}
                            nextFlightIndex={this.nextFlightsIndex}
                            nextFlightRef={this.nextFlightRef}
                            alterativeFlightsDate={this.props.alterativeFlightsDate}
                            sortedFlights={this.sortedFlights}
                            seatsReservationNotification={this.priceChangeBanner}
                            offer={this.props.currentOffer}
                        />
                    )}
                {this.isReloadingPage && (
                    <OverlaySpinner header={this.props.getPhrase(SitecoreDictionary.PriceGraphLabelsLoadingFlights)} />
                )}
            </div>
        );
    };

    render(): React.ReactNode {
        return (
            <section
                id={this.sectionId}
                className='alternative-flights step'
                data-tid='alt-flights-section'
                ref={this.flightsSectionRef}
            >
                {!this.isHidden && this.renderContent()}
            </section>
        );
    }
}

const ConnectedAlternativeFlights = inject((stores: TStores) => ({
    offer: stores.bookingStore.selectedOffer,
    alternativeFlights: stores.bookingStore.alternativeFlights,
    isLoadingFlights: stores.bookingStore.isLoadingAlternativeFlights,
    isFailedToLoadFlights: stores.bookingStore.failedLoadingAlternativeFlights,
    isFailedToLoadOffer: stores.bookingStore.failedToLoadData,
    isLoadingOffer: stores.bookingStore.isLoadingOffer,

    isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
    isExtrasPage: stores.routerStore.isExtrasPage,

    onChangeFlight: stores.bookingStore.changeFlight,
    fetchOfferAndReloadPage: stores.bookingStore.fetchOfferAndReloadPage,

    getPhrase: stores.layoutStore.getPhrase,
    alterativeFlightsDate: stores.bookingStore.alterativeFlightsDate,

    initFlightsFilters: stores.alternativeFlightsStore.initFilters,
    sortAndFilterFlights: stores.alternativeFlightsStore.sortAndFilterFlights,

    isLoadingOfferForNewDate: stores.comparePricesCalendarStore.isLoadingOfferForNewDate,
    showFlights: stores.comparePricesCalendarStore.showFlights,
    setShowFlights: stores.comparePricesCalendarStore.setShowFlights,
    originalFlightsOrdering: stores.comparePricesCalendarStore.originalFlightsOrdering,
    flights: stores.comparePricesCalendarStore.flightsList,
    currentOffer: stores.comparePricesCalendarStore.currentOffer,
    setFlights: stores.comparePricesCalendarStore.setFlights,
    resetOriginals: stores.comparePricesCalendarStore.resetOriginals,
}))(observer(class WrappedAlternativeFlights extends AlternativeFlights {}));

export default ConnectedAlternativeFlights;
