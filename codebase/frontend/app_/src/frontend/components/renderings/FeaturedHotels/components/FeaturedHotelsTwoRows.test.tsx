import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { ILivePrice } from 'models/data/ILivePrice';

import FeaturedHotelsTwoRows from './FeaturedHotelsTwoRows';

const mockFeaturedHotelCard = jest.fn();
jest.mock('frontend/components/renderings/FeaturedHotels/components/FeaturedHotelCard', () => props => {
    mockFeaturedHotelCard(props);

    return <div data-tid='featured-hotel-card' />;
});

describe('<FeaturedHotelsTwoRows />', () => {
    const resetMocks = () => ({
        hotels: [
            {
                Url: 'Url',
                Image: { value: { src: 'src' } },
                Name: 'Name',
                BookFrom: new Date().toDateString(),
                StarRating: '4',
                Region: 'Region',
                Country: 'Country',
                BookFromTitle: 'Title',
                BookFromText: 'Text',
                GiataCode: 'code1',
                livePrice: {
                    pricePP: 200,
                } as ILivePrice,
                isPriceValid: true,
            },
            {
                Url: 'Url',
                Image: { value: { src: 'src' } },
                Name: 'Name',
                BookFrom: new Date().toDateString(),
                StarRating: '4',
                Region: 'Region',
                Country: 'Country',
                BookFromTitle: 'Title',
                BookFromText: 'Text',
                GiataCode: 'code2',
                livePrice: {
                    pricePP: 100,
                } as ILivePrice,
                isPriceValid: true,
            },
        ],
        fallbackImage: 'fallbackImage',
        onClick: jest.fn(),
        displayNumberOfNights: true,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standart render with two rows with 2 hotel card', () => {
        render(<FeaturedHotelsTwoRows {...mocks} />);

        expect(screen.getAllByTestId('featured-hotels__row')).toHaveLength(2);
        expect(screen.getAllByTestId('featured-hotel-card')).toHaveLength(2);
    });

    it('should render with 3 hotel card', () => {
        mocks.hotels.push({
            Url: 'Url',
            Image: { value: { src: 'src' } },
            Name: 'Name',
            BookFrom: new Date().toDateString(),
            StarRating: '4',
            Region: 'Region',
            Country: 'Country',
            BookFromTitle: 'Title',
            BookFromText: 'Text',
            GiataCode: 'code3',
            livePrice: {
                pricePP: 300,
            } as ILivePrice,
            isPriceValid: true,
        });
        render(<FeaturedHotelsTwoRows {...mocks} />);

        expect(screen.getAllByTestId('featured-hotel-card')).toHaveLength(3);
        expect(mockFeaturedHotelCard).toHaveBeenNthCalledWith(1, {
            displayNumberOfNights: true,
            fallbackImage: 'fallbackImage',
            hotel: mocks.hotels[0],
            onClick: expect.any(Function),
        });
    });

    it('should render with 4 hotel card', () => {
        mocks.hotels = [
            ...mocks.hotels,
            {
                Url: 'Url',
                Image: { value: { src: 'src' } },
                Name: 'Name',
                BookFrom: new Date().toDateString(),
                StarRating: '4',
                Region: 'Region',
                Country: 'Country',
                BookFromTitle: 'Title',
                BookFromText: 'Text',
                GiataCode: 'code3',
                livePrice: {
                    pricePP: 300,
                } as ILivePrice,
                isPriceValid: true,
            },
            {
                Url: 'Url',
                Image: { value: { src: 'src' } },
                Name: 'Name',
                BookFrom: new Date().toDateString(),
                StarRating: '4',
                Region: 'Region',
                Country: 'Country',
                BookFromTitle: 'Title',
                BookFromText: 'Text',
                GiataCode: 'code4',
                livePrice: {
                    pricePP: 300,
                } as ILivePrice,
                isPriceValid: true,
            },
        ];
        render(<FeaturedHotelsTwoRows {...mocks} />);

        expect(screen.getAllByTestId('featured-hotel-card')).toHaveLength(4);
        expect(mockFeaturedHotelCard).toHaveBeenNthCalledWith(1, {
            displayNumberOfNights: true,
            fallbackImage: 'fallbackImage',
            hotel: mocks.hotels[0],
            onClick: expect.any(Function),
        });
    });
});
