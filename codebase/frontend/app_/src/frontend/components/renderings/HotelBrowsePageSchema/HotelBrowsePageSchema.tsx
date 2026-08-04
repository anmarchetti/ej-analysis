import { FC } from 'react';
import Head from 'next/head';

import useStore from 'frontend/hooks/useStore';
import { convertHtmlToTextWithReplacingBRsWithSpaces } from 'frontend/utils/string.utils';
import { IHotelInfoFields } from 'models/data/IHotelInfoFields';

const HotelBrowsePageSchema: FC = () => {
    const { context, pageFields, fullUrl } = useStore(stores => ({
        context: stores.layoutStore.context,
        pageFields: stores.layoutStore.pageFields as Nullable<IHotelInfoFields>,
        fullUrl: stores.layoutStore.fullUrl,
    }));

    if (!pageFields) {
        return null;
    }

    const schemaData = {
        '@type': 'Hotel',
        name: pageFields.PageTitle.value,
        image: context?.imageUrl || '',
        description: convertHtmlToTextWithReplacingBRsWithSpaces(pageFields.HotelDescription.value),
        url: fullUrl,
        address: {
            '@type': 'PostalAddress',
            addressLocality: pageFields.Resort.value,
            postalCode: pageFields.PostalCode.value,
            streetAddress: pageFields.Address.value,
            addressCountry: context?.countryName || '',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: pageFields.Latitude.value || null,
            longitude: pageFields.Longitude.value || null,
        },
        telephone: pageFields.HotelPhone.value,
        aggregateRating: {
            '@type': 'AggregateRating',
            reviewCount: pageFields.TotalNumberOfReviews.value || null,
            ratingValue: pageFields.HotelRating.value || null,
        },
        '@context': 'https://schema.org',
    };

    return (
        <Head key='hotel-browse-schema'>
            <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />;
        </Head>
    );
};

export default HotelBrowsePageSchema;
