import * as React from 'react';
import { FC, useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import qs from 'qs';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getCombinedDestinationCodes } from 'frontend/utils/destinations.utils';
import { responsive, responsiveCarouselSlim, slimCarouselMinItemsNumberToShow } from 'frontend/utils/getSlidersToShow';
import { parseQuery } from 'frontend/utils/url.utils';
import { IOffer } from 'models/data/IOffer';
import { ILuggageInformationFields } from 'models/data/IRecommendedHotels';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import CarouselOfferCard from 'frontend/components/renderings/SearchResults/components/CarouselOfferCard';
import { CarouselButton } from 'frontend/components/renderings/SearchResults/components/OffersCarouselButton';
import ViewAllHolidays from 'frontend/components/renderings/SearchResults/components/ViewAllHolidays/ViewAllHolidays';

export interface IOffersCarouselProps {
    fallbackImage: string;
    onSelectOffer: (offer: IOffer, index: number) => void;
    fields?: ILuggageInformationFields;
}

export const OffersCarousel: FC<IOffersCarouselProps> = ({ fallbackImage, onSelectOffer, fields }) => {
    const {
        isScreenExtraLarge,
        isScreenExtraSmall,
        isPromoPage,
        isSearchResultsPage,
        offers,
        getPhrase,
        buildSearchQuery,
        getSettingAsNumber,
        selectedParentDestinationCodesQuery,
    } = useStore(({ appStore, layoutStore, hotelsStore, queryParamStore, searchStore }: TStores) => ({
        isScreenExtraLarge: appStore.isScreenExtraLarge,
        isScreenExtraSmall: appStore.isScreenExtraSmall,
        isPromoPage: layoutStore.isPromoPage,
        isSearchResultsPage: layoutStore.isSearchResultsPage,
        offers: hotelsStore.parentOffers,
        getPhrase: layoutStore.getPhrase,
        buildSearchQuery: queryParamStore.buildSearchQuery,
        getSettingAsNumber: layoutStore.getSettingAsNumber,
        selectedParentDestinationCodesQuery: searchStore.searchTo.selectedParentDestinationCodesQuery,
    }));
    const offersToShow = (offers || []).slice(0, getSettingAsNumber(SiteSettings.NoResultsNumberOfTilesInCarousel));
    const haveLeftSideFiltersOnThePage = isPromoPage || isSearchResultsPage;
    const slidesResponsiveConfig = haveLeftSideFiltersOnThePage ? responsiveCarouselSlim : responsive;

    const showMoreLink = (): string => {
        /** get search object from searchQuery */
        const searchQuery = parseQuery(buildSearchQuery());

        /** get destination codes array from parent destination codes query */
        const destinationCodes = getCombinedDestinationCodes(selectedParentDestinationCodesQuery || '', '');
        /** set parentDestinationQuery to searchQuery geog */
        searchQuery[QueryParamName.Geog] = selectedParentDestinationCodesQuery;
        /** set region (region code have length 4) or countries to searchQuery destination */
        searchQuery[QueryParamName.Destination] =
            destinationCodes.find(el => el.length === 4) || destinationCodes.join(',');

        /** return new search link */
        return `${SitePath.Search}?${qs.stringify({ ...searchQuery }, { encode: false, arrayFormat: 'comma' })}`;
    };

    const offersElArray: JSX.Element[] = useMemo(
        () =>
            offersToShow.map((offer: IOffer, i: number) => (
                <CarouselOfferCard
                    key={`${offer.id}_${i}`}
                    offer={offer}
                    offerIndex={i}
                    fallbackImage={fallbackImage || ''}
                    onSelect={(offer): void => onSelectOffer(offer, i)}
                    isParentOffer
                    fields={fields}
                />
            )),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
    const showMoreLinkEl = useMemo(
        () => showMoreLink(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    if (!offers?.length) {
        return null;
    }

    const renderCarousel = (): JSX.Element => {
        if (offersToShow.length <= slimCarouselMinItemsNumberToShow && isScreenExtraLarge) {
            // useMediaQuery(`(min-width: ${ScreenBreakpoints.XL})`) should be used after after rewriting the component with functional approach

            return (
                <div className='hotels-carousel__results-list' data-tid='results'>
                    {offersElArray}
                    <ViewAllHolidays link={showMoreLinkEl} />
                </div>
            );
        }

        const minItemsNumberToShow = haveLeftSideFiltersOnThePage ? slimCarouselMinItemsNumberToShow : undefined;

        return (
            <CarouselWrapper
                responsive={slidesResponsiveConfig}
                showDots
                arrows={false}
                containerClass='slider-container'
                customButtonGroup={<CarouselButton {...(this as any)} minItemsNumberToShow={minItemsNumberToShow} />}
            >
                {offersElArray}
                <ViewAllHolidays link={showMoreLinkEl} />
            </CarouselWrapper>
        );
    };

    const renderMobileView = (): JSX.Element => (
        <div>
            {offersElArray}
            <ViewAllHolidays link={showMoreLinkEl} />
        </div>
    );

    return (
        <div className='hotels-carousel hotels-carousel--parent-destination' data-tid='parent-destination'>
            <h3 className='hotels-carousel__title' data-tid='title'>
                {getPhrase(SitecoreDictionary.SearchResultsLabelsParentDestinationCarouselTitle)}
            </h3>
            <div
                className={classNames(
                    'hotels-carousel__results',
                    offersToShow.length <= slimCarouselMinItemsNumberToShow
                        ? 'hotels-carousel__one-result'
                        : 'hotels-carousel__results',
                )}
                data-tid='parent-destination-results'
            >
                {isScreenExtraSmall ? renderMobileView() : renderCarousel()}
            </div>
        </div>
    );
};

export default observer(OffersCarousel);
