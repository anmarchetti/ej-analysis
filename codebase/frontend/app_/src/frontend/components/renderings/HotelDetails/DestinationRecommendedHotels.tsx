import * as React from 'react';
import classNames from 'classnames';
import { action, computed, makeObservable, observable, runInAction, when } from 'mobx';
import { inject, observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import offersService from 'frontend/services/offers.service';
import { TStores } from 'frontend/store/IStores';
import { getLocationHierarchy } from 'frontend/utils/getLocationHierarchy';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IBd4Tracking } from 'models/data/IBd4Tracking';
import { ILocationHierarchy, ILocationItem } from 'models/data/ILocationHierarchy';
import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';
import { TRecommendedHotelsComponent } from 'models/data/IRecommendedHotels';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';
import { DestinationType } from 'models/enum/DestinationType';
import { RecommendedType } from 'models/enum/RecommendedType';
import SiteSettings from 'models/enum/SiteSettings';
import RecommendedHotelsCarousel from 'frontend/components/common/RecommendedHotels/RecommendedHotelsCarousel/RecommendedHotelsCarousel';
import RecommendedHotelsGrid from 'frontend/components/common/RecommendedHotels/RecommendedHotelsGrid/RecommendedHotelsGrid';
import { findTestInDataLayer } from 'frontend/components/cro/Experiment/utils/experiment.utils';

export interface IRecommendedHotels extends TRecommendedHotelsComponent {
    clearRecommendedHotels: () => void;
    getSetting: (setting: string) => string;
    isEditMode: boolean;
    isHomePage: boolean;
    isHotelDetailsBookPage: boolean;
    isHotelDetailsBrowsePage: boolean;
    isHotelPreview: boolean;
    isMaintenance: boolean;
    isTradePortal: boolean;
    layout: ISitecoreLayout;
    layoutId: string;
    loadRecommendedHotels: (placementId: Nullable<Bd4TravelPlacementId>) => void;
    onSelectRecommendedOffer: (offer: IOffer, url: string) => void;
    pageName: string;
    recommendedHotels: Nullable<IOffer[]>;
    selectedOffer: Nullable<IOfferWithoutAltBoards>;
    setBd4RecommenderPlacementId: (placementId: Nullable<Bd4TravelPlacementId>) => void;
    setBd4RecommenderTracking: (tracking: Nullable<IBd4Tracking>) => void;
    trackRecommenderNotLoaded: (errorMessage?: string) => void;
}

const DEFAULT_AMOUT_OF_SHOWN_ITEMS = 9;

export class DestinationRecommendedHotels extends React.Component<IRecommendedHotels> {
    constructor(props: IRecommendedHotels) {
        super(props);
        makeObservable(this);
    }

    @observable recommendedHotels: IOffer[] = [];

    componentDidMount() {
        if (this.props.isMaintenance || this.props.isEditMode || this.props.isHotelPreview) {
            return;
        }

        if (this.props.isHotelDetailsBookPage) {
            this.loadRecommendedOffersBook();
        } else {
            this.loadRecommendedOffersBrowse();
        }
    }

    componentWillUnmount() {
        this.props.setBd4RecommenderTracking(null);
        this.props.setBd4RecommenderPlacementId(null);
        this.props.clearRecommendedHotels();
    }

    componentDidUpdate(prevProps) {
        if (this.props.isMaintenance || this.props.isEditMode) {
            return;
        }

        /*  When switching between pages with same templateId, component only updated (not unmouted)
            In this case need load offers for new page
        */

        // Load recommended offers on switching between hotel book pages
        if (this.props.isHotelDetailsBookPage && !this.props.recommendedHotels && prevProps.recommendedHotels) {
            this.loadRecommendedOffersBook();
        }

        // Load recommended offers on switching between destination pages
        if (!this.props.isHotelDetailsBookPage && prevProps.layoutId !== this.props.layoutId) {
            this.loadRecommendedOffersBrowse();
        }
    }

    @action loadRecommendedOffersBook = async () => {
        if (!this.props.recommendedHotels) {
            when(
                () => !!this.props.selectedOffer,
                () =>
                    this.props.loadRecommendedHotels(
                        this.props.isTradePortal ? Bd4TravelPlacementId.TradeHotelBook : Bd4TravelPlacementId.HotelBook,
                    ),
            );
        }
    };

    @action loadRecommendedOffersBrowse = async () => {
        this.recommendedHotels = [];
        let placementId;

        if (this.props.fields?.BD4PlacementId?.value) {
            placementId = this.props.fields.BD4PlacementId.value;
        } else {
            if (this.props.isHomePage) {
                return;
            }

            placementId = this.props.isHotelDetailsBrowsePage
                ? Bd4TravelPlacementId.HotelBrowse
                : Bd4TravelPlacementId.Destination;
        }

        this.props.setBd4RecommenderPlacementId(placementId);
        try {
            const { country, region, resort, hotel } = this.parentLocations || {};
            const destinations = this.generateDestinationsParams(country, region, resort);

            const recommendedOffers = await offersService.fetchRecommendedOffersBrowse(
                destinations,
                true,
                placementId,
                this.props.pageName,
                hotel?.code || '',
                undefined,
                this.props.fields?.NumberOfRequestedHotelBD4?.value
                    ? Number(this.props.fields.NumberOfRequestedHotelBD4.value)
                    : undefined,
            );

            if (recommendedOffers) {
                this.props.setBd4RecommenderTracking(recommendedOffers.status.tracking);

                const offers = recommendedOffers.offers ?? [];

                runInAction(() => {
                    this.recommendedHotels = offers;
                });

                !offers.length && this.props.trackRecommenderNotLoaded();
            } else {
                this.props.trackRecommenderNotLoaded();
            }
        } catch (err) {
            this.props.trackRecommenderNotLoaded(err?.message);

            return;
        }
    };

    @computed get parentLocations(): Nullable<ILocationHierarchy> {
        return getLocationHierarchy(this.props.layout);
    }

    @computed get isRecommendedGrid() {
        const { fields } = this.props;

        const hasRequiredFields = Boolean(
            fields?.InitialNumberOfHotelsDesktop?.value &&
                fields?.InitialNumberOfHotelsMobile?.value &&
                fields?.NumberOfRequestedHotelBD4?.value &&
                fields?.MinNumberOfHotelsToShowComponent?.value,
        );

        return hasRequiredFields && this.props.isHotelDetailsBrowsePage;
    }

    generateDestinationsParams(
        country: ILocationItem | undefined,
        region: ILocationItem | undefined,
        resort: ILocationItem | undefined,
    ): string[] {
        const destinations: string[] = [];

        if (country?.code) {
            destinations.push(`${DestinationType.Country.toLowerCase()}:${country.code}`);
        }

        if (region) {
            if (region.relatedRegions) {
                region.relatedRegions.forEach(code => {
                    destinations.push(`${DestinationType.Region.toLowerCase()}:${code}`);
                });
            } else {
                destinations.push(`${DestinationType.Region.toLowerCase()}:${region.code}`);
            }
        }

        if (resort) {
            if (resort.relatedResorts) {
                resort.relatedResorts.forEach(code => {
                    destinations.push(`${DestinationType.Resort.toLowerCase()}:${code}`);
                });
            } else if (resort.code) {
                destinations.push(`${DestinationType.Resort.toLowerCase()}:${resort.code}`);
            }
        }

        return destinations;
    }

    render() {
        if (
            (!this.props.recommendedHotels?.length && !this.recommendedHotels.length) ||
            this.props.isMaintenance ||
            this.props.isHotelPreview
        ) {
            return null;
        }

        const title = Tokenizer.replaceToken(
            this.props.fields?.Title?.value,
            Tokens.Name,
            this.props.layout?.sitecore?.route?.fields?.Name?.value,
        );

        const isWhiteBg = this.props.params && !!+this.props.params.IsWhiteBackground;
        const fallbackImage = this.props.getSetting(SiteSettings.HotelFallbackImage);
        const displaySponsoredLabel = isSitecoreCheckboxSelected(this.props.params?.DisplaySponsoredLabel);
        const showSponsoredHotelsOnly = isSitecoreCheckboxSelected(this.props.params?.ShowSponsoredHotelsOnly);

        // This is a AB test related - EJH-16596
        const activeVariant = findTestInDataLayer(ExperimentTestIds.RecommendedHotels);
        const isAB = ExperimentVariants.VariantA === activeVariant?.testVariant;
        const minNumberOfHotelsToShowComponent = this.props.fields?.MinNumberOfHotelsToShowComponent?.value
            ? Number(this.props.fields.MinNumberOfHotelsToShowComponent.value)
            : 0;

        const filterOffers = (offers: Nullable<IOffer[]>): IOffer[] => {
            const allOffers = offers ?? [];

            return showSponsoredHotelsOnly ? allOffers.filter(offer => offer.isSponsored) : allOffers;
        };

        const offersToDisplay = this.props.isHotelDetailsBookPage
            ? filterOffers(this.props.recommendedHotels)
            : filterOffers(this.recommendedHotels);

        if (!offersToDisplay.length || offersToDisplay.length < minNumberOfHotelsToShowComponent) {
            return null;
        }

        return (
            <div
                className={classNames('wrapper-component-container', {
                    'wrapper-component-container--grey': !isWhiteBg,
                })}
            >
                <div
                    className={classNames('wrapper-shape', {
                        'wrapper-shape--start wrapper-shape--end': !isWhiteBg,
                    })}
                >
                    {!this.props.isHomePage && <div className='wrapper-shape__triangle-start' />}
                    {this.isRecommendedGrid ? (
                        <RecommendedHotelsGrid
                            initialNumberOfHotelsDesktop={
                                this.props.fields?.InitialNumberOfHotelsDesktop?.value
                                    ? Number(this.props.fields.InitialNumberOfHotelsDesktop.value)
                                    : 0
                            }
                            initialNumberOfHotelsMobile={
                                this.props.fields?.InitialNumberOfHotelsMobile?.value
                                    ? Number(this.props.fields.InitialNumberOfHotelsMobile.value)
                                    : 0
                            }
                            title={title}
                            offers={offersToDisplay}
                            fallbackImage={fallbackImage || ''}
                            fields={this.props.fields}
                            displaySponsoredLabel={displaySponsoredLabel}
                        />
                    ) : (
                        <RecommendedHotelsCarousel
                            offers={offersToDisplay}
                            onSelectedOffer={this.props.onSelectRecommendedOffer}
                            fallbackImage={fallbackImage || ''}
                            title={title || ''}
                            isSlimCardsDesign={isAB}
                            numberOfShowItem={
                                Number(this.props.params?.MaximumNumberSlider) || DEFAULT_AMOUT_OF_SHOWN_ITEMS
                            }
                            recommendedType={
                                this.props.isHotelDetailsBookPage ? RecommendedType.Booking : RecommendedType.Browse
                            }
                            fields={this.props.fields}
                            displaySponsoredLabel={displaySponsoredLabel}
                        />
                    )}
                </div>
            </div>
        );
    }
}

const ConnectedRecommendedHotels = inject((stores: TStores) => ({
    onSelectRecommendedOffer: stores.bookingStore.onSelectRecommendedOffer,
    layout: stores.layoutStore.layout,
    layoutId: stores.layoutStore.layoutId,
    isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
    isHotelPreview: stores.layoutStore.isHotelDetailsBrowsePagePreview,
    loadRecommendedHotels: stores.bookingStore.loadRecommendedHotels,
    recommendedHotels: stores.bookingStore.recommendedHotels,
    setBd4RecommenderTracking: stores.trackingStore.setBd4RecommenderTracking,
    setBd4RecommenderPlacementId: stores.trackingStore.setBd4RecommenderPlacementId,
    trackRecommenderNotLoaded: stores.trackingStore.trackRecommenderNotLoaded,
    clearRecommendedHotels: stores.bookingStore.clearRecommendedHotels,
    isHotelDetailsBrowsePage: stores.layoutStore.isHotelDetailsBrowsePage,
    isHomePage: stores.layoutStore.isHomePage,
    selectedOffer: stores.bookingStore.selectedOffer,
    isMaintenance: stores.layoutStore.isMaintenance,
    isEditMode: stores.layoutStore.isEditMode,
    getSetting: stores.layoutStore.getSetting,
    pageName: stores.layoutStore.pageName,
    isTradePortal: stores.layoutStore.isTradePortal,
}))(observer(class WrappedRecommendedHotels extends DestinationRecommendedHotels {}));

export default ConnectedRecommendedHotels;
