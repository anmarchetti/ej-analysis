import * as React from 'react';
import { inject, observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import BaseBookingStore from 'frontend/store/base/booking/BaseBookingStore';
import { TStores } from 'frontend/store/IStores';
import { addDays } from 'frontend/utils/date.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOffer } from 'models/data/IOffer';
import { IRecommendedHotelsFields } from 'models/data/IRecommendedHotels';
import { RecommendedType } from 'models/enum/RecommendedType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import RecommendedHotelsCarousel from 'frontend/components/common/RecommendedHotels/RecommendedHotelsCarousel/RecommendedHotelsCarousel';

import NoResultsErrorBlock from './NoResultsErrorBlock/NoResultsErrorBlock';
import OffersCarousel from './OffersCarousel/OffersCarousel';
import PriceGraphForNoResults from './PriceGraphForNoResults';

interface INoResults extends IComponentWithDictionary {
    alternativeOffers: IAlternativeOffer[];
    fallbackImage: string;
    fetchOffers: (force?: boolean) => void;
    getSetting: (setting: SiteSettings) => any;
    grabSearchValuesFromSearchStore: BaseBookingStore['grabSearchValuesFromSearchStore'];
    holidayDurationSingleSearch: Nullable<number>;
    isPromoPage: boolean;
    isReferer: boolean;
    onChangeDates: (dates: Date[]) => void;
    onSelectRecommendedOffer: (offer: IOffer, url: string) => void;
    onSetSelectedOfferIndex: (idx: number) => void;
    recommendedHotels: Nullable<IOffer[]>;
    setNeedOpenWhenField: (state: boolean) => void;
    showParentOffers: boolean;
    startDate: Nullable<Date>;
    trackSearchProductClick: (offer: IOffer, index: number, isRecommended?: boolean) => void;
    fields?: IRecommendedHotelsFields;
}

export class NoResults extends React.Component<INoResults> {
    resetSelectedOffer = (newDate: Date) => {
        const endDate = addDays(this.props.holidayDurationSingleSearch || 0, newDate);

        this.props.onChangeDates([newDate, endDate]);
        this.props.grabSearchValuesFromSearchStore();
        this.props.fetchOffers(true);
    };

    private get renderErrorBlock() {
        const { getPhrase } = this.props;

        if (this.props.isReferer) {
            return (
                <NoResultsErrorBlock icon={this.props.getSetting(SiteSettings.NoResultsErrorBlockIcon)}>
                    <div className='no-offers-found'>
                        <p>{getPhrase(SitecoreDictionary.SearchResultsErrorsNoOffersFound)}</p>
                        <p>{getPhrase(SitecoreDictionary.SearchResultsErrorsAdjustDates)}</p>
                        <Button
                            dataTid='no-offers-found-button'
                            isMedium
                            onClick={() => {
                                this.props.setNeedOpenWhenField(true);
                            }}
                        >
                            {getPhrase(SitecoreDictionary.SearchResultsButtonsEditYourDates)}
                        </Button>
                    </div>
                </NoResultsErrorBlock>
            );
        }

        return (
            <NoResultsErrorBlock
                title={this.props.getSetting(SiteSettings.NoResultsErrorBlockTitle)}
                description={this.props.getSetting(SiteSettings.NoResultsErrorBlockDescription)}
                icon={this.props.getSetting(SiteSettings.NoResultsErrorBlockIcon)}
            />
        );
    }

    private get renderRecommendedHotelsOrAlternativeOffers() {
        if (
            (!this.props.recommendedHotels?.length && !this.props.alternativeOffers?.length) ||
            this.props.showParentOffers
        ) {
            return null;
        }

        return (
            <div>
                {this.props.alternativeOffers?.length ? (
                    <PriceGraphForNoResults
                        selectedDate={new Date(this.props.startDate as Date)}
                        holidayDuration={this.props.holidayDurationSingleSearch || 0}
                        resetSelectedOffer={this.resetSelectedOffer}
                    />
                ) : null}
                {this.props.recommendedHotels?.length ? (
                    <div className='wrapper-component-container'>
                        <div className='wrapper-shape wrapper-shape--start wrapper-shape--end'>
                            <RecommendedHotelsCarousel
                                offers={this.props.recommendedHotels}
                                onSelectedOffer={this.props.onSelectRecommendedOffer}
                                fallbackImage={cmsUrls.media(this.props.fallbackImage || '')}
                                title={this.props.getPhrase(
                                    this.props.isPromoPage
                                        ? SitecoreDictionary.SearchResultsLabelsBd4CarouselTitle
                                        : SitecoreDictionary.SearchResultsLabelsParentDestinationCarouselTitle,
                                )}
                                numberOfShowItem={this.props.recommendedHotels.length}
                                recommendedType={RecommendedType.Booking}
                                description={
                                    this.props.isPromoPage
                                        ? this.props.getPhrase(
                                              SitecoreDictionary.SearchResultsNotificationsBd4NoResultsPromo,
                                          )
                                        : null
                                }
                                fields={this.props.fields}
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }

    private get renderShowParentOffers() {
        if (
            !this.props.showParentOffers ||
            this.props.recommendedHotels?.length ||
            this.props.alternativeOffers?.length
        ) {
            return null;
        }

        return (
            <div className='hotels-carousel-wrapper wrapper-component-container__inner'>
                <OffersCarousel
                    onSelectOffer={(offer, i) => {
                        this.props.onSetSelectedOfferIndex(i);
                        this.props.trackSearchProductClick(offer, i, true);
                    }}
                    fallbackImage={cmsUrls.media(this.props.fallbackImage || '')}
                    fields={this.props.fields}
                />
            </div>
        );
    }

    render() {
        return (
            <>
                {this.renderErrorBlock}
                {this.renderRecommendedHotelsOrAlternativeOffers}
                {this.renderShowParentOffers}
            </>
        );
    }
}

const ConnectedNoResults = inject((stores: TStores) => ({
    isReferer: stores.queryParamStore.isReferer,
    isPromoPage: stores.layoutStore.isPromoPage,
    setNeedOpenWhenField: stores.searchStore.setNeedOpenWhenField,
    getPhrase: stores.layoutStore.getPhrase,
    getSetting: stores.layoutStore.getSetting,
    recommendedHotels: stores.bookingStore.recommendedHotels,
    trackSearchProductClick: stores.trackingStore.trackSearchProductClick,
    alternativeOffers: stores.priceGraphStore.alternativeOffers,
    showParentOffers: stores.hotelsStore.showParentOffers,
    startDate: stores.searchStore.searchWhen.from,
    holidayDurationSingleSearch: stores.priceGraphStore.holidayDurationSingleSearch,
    onChangeDates: stores.searchStore.searchWhen.onChangeDates,
    grabSearchValuesFromSearchStore: stores.bookingStore.grabSearchValuesFromSearchStore,
    fetchOffers: stores.hotelsStore.fetchOffers,
    onSelectRecommendedOffer: stores.bookingStore.onSelectRecommendedOffer,
}))(observer(class WrappedNoResults extends NoResults {}));

export default ConnectedNoResults;
