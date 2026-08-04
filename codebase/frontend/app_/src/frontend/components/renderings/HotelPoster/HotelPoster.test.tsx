import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import HotelPoster from './HotelPoster';

jest.mock('./components/HotelPosterContent', () => ({
    __esModule: true,
    default: () => <div data-tid='hotel-poster-content' />,
}));

jest.mock('frontend/components/common/Poster', () => ({
    __esModule: true,
    Root: ({ children }) => <div data-tid='poster-root'>{children}</div>,
}));

describe('<HotelPoster />', () => {
    const resetMocks = () => ({
        hasEjLogo: false,
        hasUMLogo: false,
        UMLogoImage: '',
        logoImage: mockSitecoreField({
            src: '/holidays/cms/media/-/jssmedia/project/trade-portal/easyjet-holidays-lockup-brand.ashx?h=111&iar=0&w=172&hash=96F0A393B57127DB319E0D2AF7ECAD05',
            alt: 'easyJet Holidays Lockup Brand',
            width: 172,
            height: 111,
        }),
        posterId: '',
        fields: {
            RoundUpDescription: mockSitecoreField('Your original price is £{price}. We round it up.'),
            RoomLabel: mockSitecoreField('Room:'),
            BoardLabel: mockSitecoreField('Board:'),
            AirportLabel: mockSitecoreField('Flying from'),
            DepositLabel: mockSitecoreField('Book with just £60pp deposit'),
            ConclusionLabel: mockSitecoreField('Booking conditions apply. Prices subject to change'),
            RoundUpTitle: mockSitecoreField('Please be informed a price is round-up'),
        },
        posterFields: {},
        params: {},
        rendering: {},
    });
    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should always render HotelPosterContent', () => {
        render(<HotelPoster {...mocks} />);

        expect(within(screen.getByTestId('poster-root')).getByTestId('hotel-poster-content')).toBeInTheDocument();
    });
});
