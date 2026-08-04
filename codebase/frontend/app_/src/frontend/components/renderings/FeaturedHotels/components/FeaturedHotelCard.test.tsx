import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import * as utils from 'frontend/utils/date.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { MediaSize } from 'models/data/MediaSizeParams';

import { FeaturedHotelCard, IFeaturedHotelCardProps } from './FeaturedHotelCard';

const resetMocks = (): IFeaturedHotelCardProps => ({
    hotel: {
        Url: '/Url',
        Image: mockSitecoreField(mockSitecoreImageField('src')),
        Name: 'Name',
        BookFrom: new Date().toDateString(),
        StarRating: '4',
        Region: 'Region',
        Country: 'Country',
        BookFromTitle: 'Title',
        BookFromText: 'Text',
        GiataCode: 'GiataCode',
        livePrice: null,
        isPriceValid: true,
    },
    displayNumberOfNights: true,
    fallbackImage: 'fallbackImage',
    onClick: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isEditMode: false,
            isLivePriceEnabled: true,
            basePath: '/en-holidays',
        },
        appStore: { isScreenMedium: false },
        routerStore: { searchResultsUrl: jest.fn(query => `/search?${query}`) },
        queryParamStore: {
            buildSearchQueryByLivePrice: jest.fn(() => 'query'),
        },
        bookingStore: { setSearchValuesByQueryString: jest.fn() },
    });

jest.mock('frontend/utils/url.utils', () => ({
    ...jest.requireActual('frontend/utils/url.utils'),
    purifyUrl: jest.fn(url => url),
}));

const mockJSSNextImageComponent = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSNextImageComponent(props);

        return <div data-tid='jss-image' />;
    },
}));

jest.mock('frontend/components/common/Link', () => ({ children, href }) => (
    <a data-tid='link' href={href}>
        {children}
    </a>
));
jest.mock('frontend/components/renderings/FeaturedHotels/components/FeaturedHotelCardInfo', () => () => (
    <div data-tid='featured-hotel-card-info' />
));

jest.mock('frontend/components/renderings/FeaturedHotels/components/FeaturedHotelCardInfo', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockFeaturedHotelCardInfoComponent(props);

        return <div data-tid='featured-hotel-card-info' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockLinkComponent = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLinkComponent(props);

        return <div data-tid='link'>{children}</div>;
    },
}));

const mockFeaturedHotelCardInfoComponent = jest.fn();
jest.mock('frontend/components/renderings/FeaturedHotels/components/FeaturedHotelCardInfo', () => ({
    __esModule: true,
    default: props => {
        mockFeaturedHotelCardInfoComponent(props);

        return <div data-tid='featured-hotel-card-info' />;
    },
}));

jest.mock('frontend/hooks/useMediaQuery');

let mocks;
let mockStores;

describe('<FeaturedHotelCard />', () => {
    beforeEach(() => {
        jest.spyOn(utils, 'formatDateL10n').mockReturnValue('formated date');
        mocks = resetMocks();
        mockStores = createStores();
        jest.mocked(useMobileViewport).mockReturnValue(false);
    });

    it('should be empty render if there is no data', () => {
        mocks.hotel = undefined;

        const { container } = render(<FeaturedHotelCard {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        render(<FeaturedHotelCard {...mocks} />);

        expect(screen.getByTestId('featured-hotel-card')).toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSNextImageComponent).toHaveBeenNthCalledWith(1, {
            field: mocks.hotel.Image,
            fallbackImage: 'fallbackImage',
            fill: true,
            mediaSize: { desktop: MediaSize.Medium },
        });

        expect(screen.getByTestId('btn')).toBeInTheDocument();
        expect(screen.getByTestId('link')).toBeInTheDocument();
        expect(screen.getByTestId('featured-hotel-card-info')).toBeInTheDocument();
        expect(mockFeaturedHotelCardInfoComponent).toHaveBeenNthCalledWith(1, {
            displayNumberOfNights: true,
            hasLivePrice: null,
            hotel: mocks.hotel,
            infoBlockHeight: undefined,
        });
    });

    it('Should render link to hotel if there is no live price', async () => {
        render(<FeaturedHotelCard {...mocks} />);

        const button = screen.getByTestId('btn');

        await userEvent.click(button);
        expect(mockStores.bookingStore.setSearchValuesByQueryString).not.toHaveBeenCalled();
    });

    it('should render BookFromText when BookFrom is NOT provided', () => {
        jest.spyOn(utils, 'formatDateL10n').mockReturnValue('');

        render(<FeaturedHotelCard {...mocks} />);

        expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should NOT render badge when BookFromText and BookFrom are NOT provided', () => {
        jest.spyOn(utils, 'formatDateL10n').mockReturnValue('');
        mocks.hotel.BookFromText = undefined;

        render(<FeaturedHotelCard {...mocks} />);

        expect(screen.queryByTestId('featured-hotel-card-badge')).not.toBeInTheDocument();
    });

    it('should render badge when BookFromText is provided', () => {
        jest.spyOn(utils, 'formatDateL10n').mockReturnValue('test date');
        mocks.hotel.BookFromText = undefined;

        render(<FeaturedHotelCard {...mocks} />);

        expect(screen.getByTestId('featured-hotel-card-badge')).toHaveTextContent('test date');
    });

    it('should render badge when BookFrom is provided', () => {
        jest.spyOn(utils, 'formatDateL10n').mockReturnValue('');

        render(<FeaturedHotelCard {...mocks} />);

        expect(screen.getByTestId('featured-hotel-card-badge')).toHaveTextContent('Text');
    });

    it('should render BookFromText when BookFrom is NOT provided', () => {
        jest.spyOn(utils, 'formatDateL10n').mockReturnValue('');

        render(<FeaturedHotelCard {...mocks} />);

        expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should call onClick and setSearchValuesByQueryString when user clicks btn', async () => {
        mocks.hotel.livePrice = { pricePP: 200 } as ILivePrice;

        render(<FeaturedHotelCard {...mocks} />);

        const button = screen.getByTestId('btn');

        await userEvent.click(button);

        expect(mockStores.bookingStore.setSearchValuesByQueryString).toHaveBeenCalled();
    });

    it('should call the useEffect with addEventListener to set height', async () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        render(<FeaturedHotelCard {...mocks} />);

        expect(addEventListenerSpy).toHaveBeenCalled();
    });

    describe('Luxury Badge', () => {
        it('should be rendered when hotel is luxury', () => {
            mocks.hotel.livePrice = {
                promoCollections: ['lux'],
            };

            render(<FeaturedHotelCard {...mocks} />);

            expect(screen.getByTestId('luxury-badge-icon')).toBeInTheDocument();
        });

        it('should NOT be rendered when hotel is not luxury', () => {
            render(<FeaturedHotelCard {...mocks} />);

            expect(screen.queryByTestId('luxury-badge-icon')).not.toBeInTheDocument();
        });
    });
});
