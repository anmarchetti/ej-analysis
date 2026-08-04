import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockedPoster } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IHotelPosterProps } from 'frontend/components/renderings/HotelPoster/HotelPoster';

import HotelPosterContent from './HotelPosterContent';

const createPoster = () => ({ ...mockedPoster });
jest.mock('react-tooltip', () => ({
    Tooltip: jest.fn().mockImplementation(() => <div role='tooltip' />),
}));

const mockHotelDetailsLayout = jest.fn();
jest.mock('./HotelDetailsLayout', () => ({
    __esModule: true,
    default: props => {
        mockHotelDetailsLayout(props);

        return <div data-tid='hotel-details-layout' />;
    },
}));

const createStores = () => ({
    bookingStore: {
        totalPricePPWithTouristTax: 362,
    },
});

const createProps = (): IHotelPosterProps => ({
    fields: {
        RoundUpDescription: mockSitecoreField('Your original price is £{price}. We round it up.'),
        RoomLabel: mockSitecoreField('Room:'),
        BoardLabel: mockSitecoreField('Board:'),
        AirportLabel: mockSitecoreField('Flying from'),
        DepositLabel: mockSitecoreField('Book with just £60pp deposit'),
        ConclusionLabel: mockSitecoreField('Booking conditions apply. Prices subject to change'),
        RoundUpTitle: mockSitecoreField('Please be informed a price is round-up'),
    },
    hasEjLogo: false,
    hasUMLogo: false,
    UMLogoImage: '',
    logoImage: mockSitecoreField({
        src: '/holidays/cms/media/-/jssmedia/project/trade-portal/easyjet-holidays-lockup-brand.ashx?h=111&iar=0&w=172&hash=96F0A393B57127DB319E0D2AF7ECAD05',
        alt: 'easyJet Holidays Lockup Brand',
        width: 172,
        height: 111,
    }),
    posterId: '2',
    params: {},
    rendering: {},
    posterFields: {},
});

let mockPoster = createPoster();
let mockStores = createStores();
let mocks = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ ...mockStores, ...mockPoster }),
}));

describe('<HotelPosterContent />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mocks = createProps();
        mockPoster = createPoster();
    });

    it('should not render when no fields', () => {
        mocks.fields = null as any;
        const { container } = render(<HotelPosterContent {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render error popup', () => {
        render(<HotelPosterContent {...mocks} />);

        expect(screen.queryByText('BookingFailed.Buttons.TryAgain')).not.toBeInTheDocument();
    });

    it('should render HotelDetailsLayout', () => {
        render(<HotelPosterContent {...mocks} />);

        expect(screen.getByTestId('hotel-details-layout')).toBeInTheDocument();
        expect(mockHotelDetailsLayout).toHaveBeenCalledWith({
            fields: mocks.fields,
            wholePartPP: 362,
            posterId: mocks.posterId,
            hasUMLogo: mocks.hasUMLogo,
            hasEjLogo: mocks.hasEjLogo,
            logoImage: mocks.logoImage,
            UMLogoImage: mocks.UMLogoImage,
            posterFields: mocks.posterFields,
        });
    });
});
