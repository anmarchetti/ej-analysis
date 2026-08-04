import React from 'react';
import { render, screen } from '@testing-library/react';

import * as stringUtils from 'frontend/utils/string.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import HotelBrowsePageSchema from './HotelBrowsePageSchema';

jest.mock('next/head', () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/string.utils', () => ({
    convertHtmlToTextWithReplacingBRsWithSpaces: jest.fn(),
}));

const createStores = () => ({
    layoutStore: {
        fullUrl: true,
        context: {
            imageUrl: 'imageUrl',
            countryName: 'countryName',
        },
        pageFields: {
            PageTitle: mockSitecoreField('PageTitle'),
            HotelDescription: mockSitecoreField('HotelDescription'),
            Resort: mockSitecoreField('Resort'),
            PostalCode: mockSitecoreField('PostalCode'),
            Address: mockSitecoreField('Address'),
            Longitude: mockSitecoreField(41),
            Latitude: mockSitecoreField(2),
            HotelPhone: mockSitecoreField('HotelPhone'),
            TotalNumberOfReviews: mockSitecoreField(676),
            HotelRating: mockSitecoreField(4.5),
        },
    },
});

let mockStores;

const getSchemaJson = (): any => {
    const script =
        screen.queryByTestId('hotel-schema-script') || document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();

    return JSON.parse(script!.innerHTML);
};

describe('<HotelBrowsePageSchema />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render schema', () => {
        const mockedDescriptionText = 'MOCKED_DESCRIPTION';
        (stringUtils.convertHtmlToTextWithReplacingBRsWithSpaces as jest.Mock).mockReturnValue(mockedDescriptionText);
        render(<HotelBrowsePageSchema />);

        const schema = getSchemaJson();

        expect(stringUtils.convertHtmlToTextWithReplacingBRsWithSpaces).toHaveBeenCalledWith(
            mockStores.layoutStore.pageFields.HotelDescription.value,
        );
        expect(schema['@type']).toBe('Hotel');
        expect(schema['@context']).toBe('https://schema.org');
        expect(schema).toMatchObject({
            '@type': 'Hotel',
            '@context': 'https://schema.org',
            name: mockStores.layoutStore.pageFields.PageTitle.value,
            image: mockStores.layoutStore.context.imageUrl,
            description: mockedDescriptionText,
            url: mockStores.layoutStore.fullUrl,
            address: {
                addressLocality: mockStores.layoutStore.pageFields.Resort.value,
                postalCode: mockStores.layoutStore.pageFields.PostalCode.value,
                streetAddress: mockStores.layoutStore.pageFields.Address.value,
                addressCountry: mockStores.layoutStore.context.countryName,
            },
            geo: {
                latitude: mockStores.layoutStore.pageFields.Latitude.value,
                longitude: mockStores.layoutStore.pageFields.Longitude.value,
            },
            telephone: mockStores.layoutStore.pageFields.HotelPhone.value,
            aggregateRating: {
                ratingValue: mockStores.layoutStore.pageFields.HotelRating.value,
                reviewCount: mockStores.layoutStore.pageFields.TotalNumberOfReviews.value,
            },
        });
    });

    it('should render schema with missing optional fields', () => {
        mockStores.layoutStore.pageFields = {
            ...mockStores.layoutStore.pageFields,
            Longitude: mockSitecoreField(undefined),
            Latitude: mockSitecoreField(undefined),
            TotalNumberOfReviews: mockSitecoreField(undefined),
            HotelRating: mockSitecoreField(undefined),
        };

        render(<HotelBrowsePageSchema />);

        const schema = getSchemaJson();
        expect(schema.geo.latitude).toBe(null);
        expect(schema.geo.longitude).toBe(null);
        expect(schema.aggregateRating.ratingValue).toBe(null);
        expect(schema.aggregateRating.reviewCount).toBe(null);
    });

    it('should NOT render schema when pageFields value is null', () => {
        mockStores.layoutStore.pageFields = null;

        const { container } = render(<HotelBrowsePageSchema />);

        expect(container).toBeEmptyDOMElement();
    });
});
