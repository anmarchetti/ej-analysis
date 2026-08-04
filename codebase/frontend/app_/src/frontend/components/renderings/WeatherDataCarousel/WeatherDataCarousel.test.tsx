import React from 'react';
import { ComponentRendering, useComponentProps } from '@sitecore-jss/sitecore-jss-nextjs';
import { render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores, mockHotel } from 'frontend/__mocks__';
import { createServerSidePageContext } from 'frontend/__mocks__/createServerSidePageContext';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import offersService from 'frontend/services/offers.service';
import weatherDataService from 'frontend/services/weatherDataService/weatherData.service';
import { isHotelDetails } from 'frontend/utils/buildSitecorePath';
import { getMonthName } from 'frontend/utils/date.utils';
import { getLocationHierarchy } from 'frontend/utils/getLocationHierarchy';
import { IWeatherData } from 'models/data/IBookingInfo';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { responsiveConfig } from './constants';
import * as utils from './weatherData.utils';
import WeatherDataCarousel, { getServerSideProps, TWeatherDataCarouselProps } from './WeatherDataCarousel';

const createProps = (): TWeatherDataCarouselProps => ({
    fields: {
        Title: {
            value: 'title',
        },
    },
    rendering: {} as ComponentRendering,
    params: {},
    wasRerendered: true,
});

const createStores = () =>
    createMockStores({
        appStore: {
            isScreenLessMedium: true,
            isScreenExtraLarge: false,
        },
        bookingStore: {
            hotel: mockHotel,
            selectedOffer: { date: '2024-01-01' },
        },
        layoutStore: {
            layout: {},
            isHotelDetailsBookPage: true,
        },
        routerStore: {
            pathname: '/test-path',
        },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    withDatasourceCheck: () => component => component,
    useComponentProps: jest.fn(),
}));
const mockUseComponentProps = useComponentProps as jest.MockedFn<typeof useComponentProps>;

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

jest.mock('frontend/utils/getLocationHierarchy');
const mockGetLocationHierarchy = getLocationHierarchy as jest.MockedFn<typeof getLocationHierarchy>;

const mockCarouselComponent = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: props => {
        mockCarouselComponent(props);

        return (
            <div data-tid='carousel'>
                {props.children}
                {props.customButtonGroup}
            </div>
        );
    },
}));

const mockWeatherDataCardComponent = jest.fn();
jest.mock('frontend/components/renderings/WeatherDataCarousel/components/WeatherDataCard/WeatherDataCard', () => ({
    __esModule: true,
    default: props => {
        mockWeatherDataCardComponent(props);

        return <div data-tid='weather-data-card' />;
    },
}));

const mockCarouselButtonsGroup = jest.fn();
jest.mock('frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup', () => ({
    __esModule: true,
    default: props => {
        mockCarouselButtonsGroup(props);

        return <div data-tid='carousel-buttons-group' />;
    },
}));

const mockTextWithTooltip = jest.fn();
jest.mock('frontend/components/common/TextWithTooltip/TextWithTooltip', () => ({
    __esModule: true,
    default: props => {
        mockTextWithTooltip(props);

        return <div data-tid='text-with-tooltip' />;
    },
}));

jest.mock('frontend/services/offers.service');
const mockGetHotelInfo = offersService.loadHotelInfo as jest.MockedFn<typeof offersService.loadHotelInfo>;

const mockWeatherData: IWeatherData = {
    averageTemp: [0],
    rainyDays: [0],
    region: 'region',
};

const mockGetWeather = jest.spyOn(weatherDataService, 'getWeather').mockResolvedValue(mockWeatherData);
const mockGetInitialCarouselSlide = jest.spyOn(utils, 'getInitialCarouselSlide').mockReturnValue(4);

jest.mock('frontend/utils/buildSitecorePath', () => ({
    isHotelDetails: jest.fn(() => false),
}));
const mockIsHotelDetails = isHotelDetails as jest.MockedFn<typeof isHotelDetails>;

describe('<WeatherDataCarousel/>', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
        mockUseComponentProps.mockReturnValue(mockWeatherData);
    });

    it('should NOT render component when weatherData is undefined', () => {
        mockUseComponentProps.mockReturnValue(undefined);

        const { container } = render(<WeatherDataCarousel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when weatherData.averageTemp is undefined', () => {
        mockUseComponentProps.mockReturnValue({
            averageTemp: undefined,
        });

        const { container } = render(<WeatherDataCarousel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when weatherData.averageTemp is empty', () => {
        mockUseComponentProps.mockReturnValue({
            averageTemp: [],
        });

        const { container } = render(<WeatherDataCarousel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render the title when fields is undefined', () => {
        mockProps.fields = undefined;

        render(<WeatherDataCarousel {...mockProps} />);

        expect(mockReplaceToken).not.toHaveBeenCalled();
    });

    it('should NOT render the title when fields.Title.value is empty', () => {
        mockProps.fields = {
            Title: {
                value: '',
            },
        };

        render(<WeatherDataCarousel {...mockProps} />);

        expect(mockReplaceToken).not.toHaveBeenCalled();
    });

    it('should NOT render the title when regionName is undefined', () => {
        mockStores.bookingStore.hotel = { ...mockHotel, location: { ...location, name: undefined } };

        render(<WeatherDataCarousel {...mockProps} />);

        expect(mockReplaceToken).not.toHaveBeenCalled();
    });

    it('should render title with regionName retrieved from hotel object when isHotelDetailsBookPage is true', () => {
        const regionName = 'test';
        mockStores.bookingStore.hotel = { ...mockHotel, location: { ...mockHotel.location, name: regionName } };

        render(<WeatherDataCarousel {...mockProps} />);

        expect(mockReplaceToken).toHaveBeenCalledWith(mockProps.fields?.Title.value, Tokens.Region, regionName);
    });

    it('should render title with regionName retrieved from layout when isHotelDetailsBookPage is false', () => {
        const regionName = 'test';
        mockGetLocationHierarchy.mockReturnValueOnce({
            region: {
                name: regionName,
                code: 'code',
            },
        });
        mockStores.layoutStore.isHotelDetailsBookPage = false;

        render(<WeatherDataCarousel {...mockProps} />);

        expect(mockReplaceToken).toHaveBeenCalledWith(mockProps.fields?.Title.value, Tokens.Region, regionName);
    });

    it('should render carousel', () => {
        render(<WeatherDataCarousel {...mockProps} />);

        expect(mockCarouselComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                responsive: responsiveConfig,
                showDots: true,
                arrows: false,
                customButtonGroup: undefined,
                partialVisible: true,
                dotListClass: 'carouselDotList',
                initialSlide: 4,
            }),
        );
        expect(screen.getByTestId('weather-data-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('text-with-tooltip')).toBeInTheDocument();
        expect(mockWeatherDataCardComponent).toHaveBeenCalledWith({
            daysOfRain: `${mockWeatherData.rainyDays[0]} ${SitecoreDictionary.WeatherLabelsDaysOfRain}`,
            degree: mockWeatherData.averageTemp![0],
            month: getMonthName(0),
        });
        expect(mockTextWithTooltip).toHaveBeenCalledWith({
            message: 'title United States',
            tooltipMessage: SitecoreDictionary.SearchPodFiltersLabelsWeatherTooltip,
            wrapperClassName: 'title',
            tag: 'h2',
            tooltipTriggerClassName: 'tooltipTrigger',
            dataTid: 'weather-data-title',
        });
        expect(mockGetInitialCarouselSlide).toHaveBeenCalledWith([[0]], '2024-01-01');
    });

    it('should call getInitialCarouselSlide with empty date when isHotelDetailsBookPage is false', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = false;

        render(<WeatherDataCarousel {...mockProps} />);

        expect(mockGetInitialCarouselSlide).toHaveBeenCalledWith([[0]], '');
    });

    it('should pass customButtonGroup as CarouselButtonsGroup component when isScreenLessMedium is false', () => {
        mockStores.appStore.isScreenLessMedium = false;

        render(<WeatherDataCarousel {...mockProps} />);

        expect(mockCarouselButtonsGroup).toHaveBeenCalled();
    });

    it('should pass customButtonGroup as undefined when wasRerendered is false', () => {
        mockProps.wasRerendered = false;
        mockStores.appStore.isScreenLessMedium = false;

        render(<WeatherDataCarousel {...mockProps} />);

        expect(mockCarouselComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                customButtonGroup: undefined,
            }),
        );
    });

    it('should pass daysOfRain as undefined to WeatherDataCard when rainyDays corresponding element is undefined', () => {
        mockUseComponentProps.mockReturnValue({ ...mockWeatherData, rainyDays: [] });

        render(<WeatherDataCarousel {...mockProps} />);

        expect(mockWeatherDataCardComponent).toHaveBeenCalledWith({
            daysOfRain: undefined,
            degree: mockWeatherData.averageTemp![0],
            month: getMonthName(0),
        });
    });

    it('should split average temperature card to weather-carousel-slide-wrapper', () => {
        jest.spyOn(utils, 'getNumberOfItemsInCarouselSlide').mockReturnValue(4);
        const mockFullWeatherData = {
            averageTemp: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            rainyDays: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            region: 'region',
        };
        mockUseComponentProps.mockReturnValue({ ...mockFullWeatherData });

        render(<WeatherDataCarousel {...mockProps} />);

        expect(screen.getAllByTestId('weather-data-card')).toHaveLength(12);
        expect(screen.getAllByTestId('weather-carousel-slide-wrapper')).toHaveLength(3);
    });
});

describe('getServerSideProps', () => {
    let context;

    beforeEach(() => {
        context = createServerSidePageContext();
        context.req.headers = {
            cookie: 'cookie',
        };
    });

    it('should invoke weatherDataService.getWeather with code based on hotelInfo', async () => {
        mockGetHotelInfo.mockResolvedValueOnce(mockHotel);
        mockIsHotelDetails.mockReturnValueOnce(true);
        context.query = {
            [QueryParamName.AccommodationId]: 'accId',
        };

        const result = await getServerSideProps({} as ComponentRendering, {} as ISitecoreLayout, context);

        expect(mockGetHotelInfo).toHaveBeenCalledWith('accId', undefined, undefined, context.req.headers.cookie);
        expect(mockGetWeather).toHaveBeenCalledWith(mockHotel.location.code, context.req.headers.cookie);
        expect(result).toEqual(mockWeatherData);
    });

    it('should invoke weatherDataService.getWeather with code based on layout', async () => {
        const code = 'test';
        mockGetLocationHierarchy.mockReturnValueOnce({
            region: {
                name: 'regionName',
                code,
            },
        });

        const result = await getServerSideProps({} as ComponentRendering, {} as ISitecoreLayout, context);

        expect(mockGetWeather).toHaveBeenCalledWith(code, context.req.headers.cookie);
        expect(result).toEqual(mockWeatherData);
    });

    it('should return NULL when code is undefined', async () => {
        mockGetLocationHierarchy.mockReturnValueOnce(undefined);

        const result = await getServerSideProps({} as ComponentRendering, {} as ISitecoreLayout, context);

        expect(result).toBeNull();
    });
});
