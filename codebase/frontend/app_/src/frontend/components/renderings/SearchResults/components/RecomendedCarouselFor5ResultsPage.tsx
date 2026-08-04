import React, { FC } from 'react';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISearchResultsFields } from 'models/data/ISearchResultsFields';
import { RecommendedType } from 'models/enum/RecommendedType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RecommendedHotelsCarousel from 'frontend/components/common/RecommendedHotels/RecommendedHotelsCarousel/RecommendedHotelsCarousel';

interface IRecommendedCarouselFor5ResultsPageProps {
    fallbackImage: string;
    fields?: ISearchResultsFields;
}

const RecommendedCarouselFor5ResultsPage: FC<IRecommendedCarouselFor5ResultsPageProps> = ({
    fallbackImage,
    fields,
}) => {
    const { getPhrase, recommendedHotels, onSelectRecommendedOffer } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        recommendedHotels: stores.bookingStore.recommendedHotels,
        onSelectRecommendedOffer: stores.bookingStore.onSelectRecommendedOffer,
    }));

    return recommendedHotels?.length ? (
        <div className='wrapper-component-container'>
            <div className='wrapper-shape wrapper-shape--start wrapper-shape--end'>
                <RecommendedHotelsCarousel
                    offers={recommendedHotels}
                    onSelectedOffer={onSelectRecommendedOffer}
                    fallbackImage={cmsUrls.media(fallbackImage || '')}
                    title={getPhrase(SitecoreDictionary.SearchResultsLabels5ResultsTittleForBD4CArousel)}
                    numberOfShowItem={recommendedHotels.length}
                    recommendedType={RecommendedType.Booking}
                    description={getPhrase(SitecoreDictionary.SearchResultsLabels5ResultsDescriptionForBD4CArousel)}
                    className='hotels-carousel--five-results'
                    fields={fields}
                />
            </div>
        </div>
    ) : null;
};

export default observer(RecommendedCarouselFor5ResultsPage);
