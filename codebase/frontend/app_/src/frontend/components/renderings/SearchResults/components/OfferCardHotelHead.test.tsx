import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { IOffer } from 'models/data/IOffer';

import OfferCardHotelHead, { IOfferCardHotelHeadProps } from './OfferCardHotelHead';

jest.mock('frontend/components/common/Checkbox', () => () => <div data-tid='checkbox' />);

jest.mock('frontend/components/common/StarRating', () => () => <div data-tid='star-rating' />);

jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => () => (
    <div data-tid='tripadvisor-info' />
));

jest.mock('frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton', () => () => (
    <div data-tid='shortlist-button' />
));

jest.mock('frontend/components/common/OfferCardHotelTitle/OfferCardHotelTitle', () => () => (
    <div data-tid='hotel-card-head-title' />
));

const resetMocks = (): IOfferCardHotelHeadProps => ({
    offer: {
        hotel: {
            numberOfReviews: 0,
            rating: 0,
            name: 'Hotel Name',
            resort: {
                name: 'resort',
            },
            location: {
                name: 'location',
            },
            country: {
                name: 'country',
            },
        },
    } as IOffer,
    hotelLink:
        'en/holidays/turkey/dalaman/dalyan/asur-hotel-apartments?ibf=true&to=19-08-2023&from=13-08-2023&dst=ALL&geog=ALL&sAccId=&flex=0&org[0]=MAN&aa=1&rooms[0][adults]=2&rooms[0][children]=0&rooms[0][infants]=0&outId=E19925718f2ec8dd55d622417e140b16c&inId=E3bec762d82f278aa4a7587254466c1e1&accId=TRDL0093&packId=2207004299/2/2050/6&offerCode=TRDL0093_2207004299%2F2%2F2050%2F6_DB01-BB&boardType=BB&offerRooms[0][adults]=2&offerRooms[0][children]=0&offerRooms[0][infants]=0&offerRooms[0][roomCode]=DB01&transfer=DIAN012849SS&dtransfer=DIAN012849SS&isExt=0&lateRoomCheckout=0&theme=beach',
    onClickSelect: jest.fn(),
    hasShortlistBookmark: false,
    isSelectionEditMode: false,
    isSelectedToEdit: false,
    onChangeEditSelection: jest.fn(),
});

let mockProps;

describe('<OfferCardHotelHead />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
    });

    it('should render', () => {
        render(<OfferCardHotelHead {...mockProps} />);
        expect(screen.getByTestId('hotel-card-head')).toBeInTheDocument();
        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-card-head-title')).toBeInTheDocument();
    });

    it('should render card with shortlist button', () => {
        mockProps.hasShortlistBookmark = true;
        render(<OfferCardHotelHead {...mockProps} />);
        expect(screen.getByTestId('shortlist-button')).toBeInTheDocument();
    });

    it('should render card without shortlist button', () => {
        render(<OfferCardHotelHead {...mockProps} />);
        expect(screen.queryByTestId('shortlist-button')).not.toBeInTheDocument();
    });

    it('should render card with Trip Advisor', () => {
        mockProps.offer.hotel = { numberOfReviews: 5, rating: 5 };
        render(<OfferCardHotelHead {...mockProps} />);
        expect(screen.getByTestId('tripadvisor-info')).toBeInTheDocument();
    });

    it('should render card in Selection Edit Mode', () => {
        mockProps.isSelectionEditMode = true;
        mockProps.isSelectedToEdit = true;
        mockProps.offer.shortListId = 'test';

        render(<OfferCardHotelHead {...mockProps} />);
        expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    });
});
