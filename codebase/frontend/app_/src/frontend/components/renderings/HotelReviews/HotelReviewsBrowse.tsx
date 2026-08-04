import { FC } from 'react';
import { ComponentRendering, useComponentProps } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import reviewsService from 'frontend/services/reviews.service';
import { IReviewsData } from 'frontend/store/base';
import { prepareReviewsData } from 'frontend/utils/hotelReviews.utils';
import { TServerSidePageContext } from 'lib/page-props';
import { IAnchorParameters } from 'models/data/IAnchorParameters';
import { IHotelInfoFields } from 'models/data/IHotelInfoFields';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { withRerender } from 'frontend/components/hoc';

import Reviews from './components/Reviews';

type THotelHotelReviewsBrowseProps = ISitecoreComponent<IHotelInfoFields, IAnchorParameters>;

export const HotelReviewsBrowse: FC<THotelHotelReviewsBrowseProps> = ({ fields, rendering, params }) => {
    const data: Nullable<IReviewsData> = useComponentProps(rendering.uid);

    const { pageFields } = useStore(stores => ({
        pageFields: stores.layoutStore.pageFields as Nullable<IHotelInfoFields>,
    }));

    if (pageFields) {
        const rating = pageFields.HotelRating ? Number.parseFloat(pageFields.HotelRating.value) : null;
        const reviews = pageFields.TotalNumberOfReviews ? Number.parseInt(pageFields.TotalNumberOfReviews.value) : null;

        return (
            <Reviews
                anchor={params?.Anchor}
                reviews={reviews}
                rating={rating}
                tripadvisorId={pageFields.TripAdvisorId?.value || fields?.TripAdvisorId.value}
                SSRData={data}
                showRatingValue
            />
        );
    }

    return null;
};

export const getServerSideProps: (
    rendering: ComponentRendering,
    layout: ISitecoreLayout,
    context: TServerSidePageContext,
) => Promise<IReviewsData | null> = async (rendering, layout) => {
    const tripAdvisorId = layout?.sitecore?.route.fields.TripAdvisorId?.value;

    if (!tripAdvisorId) {
        return null;
    }

    const data = await reviewsService.fetchReviews(tripAdvisorId);

    return prepareReviewsData(data);
};

export default withRerender(HotelReviewsBrowse);
