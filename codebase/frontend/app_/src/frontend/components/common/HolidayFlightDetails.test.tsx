import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockHotel, mockTheme } from 'frontend/__mocks__';
import { extraLuggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockedTransport } from 'frontend/__mocks__/transport';
import { getNumberOfGuestsByCategory } from 'frontend/utils/guestsValidation';
import { isShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { HolidayFlightDetails, IHolidayFlightDetailsProps } from './HolidayFlightDetails';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(k => k), isShortlistPage: false },
    appStore: { isScreenMedium: true },
});

const createProps = (): IHolidayFlightDetailsProps => ({
    luggageCount: 4,
    night: 7,
    packageIcons: mockTheme.packageIcons,
    routeArr: mockedTransport.routes[0],
    routeDep: mockedTransport.routes[1],
    transfer: null,
    isRecommendedOffer: false,
    luggageText: 'test luggage',
    offer: null as Nullable<IOffer>,
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/shortlist.utils', () => ({
    __esModule: true,
    isShortlistOfferUnavailable: jest.fn(),
}));
jest.mock('frontend/utils/guestsValidation', () => ({
    __esModule: true,
    getNumberOfGuestsByCategory: jest.fn(),
}));

jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: () => <div data-tid='image-with-filter' />,
    SVGFilterMatrix: {
        Lightblack: 'lightblack',
    },
}));

const mockHoldBagsShortInfo = jest.fn();
jest.mock('./HoldBagsShortInfo/HoldBagsShortInfo', () => ({
    __esModule: true,
    default: props => {
        mockHoldBagsShortInfo(props);

        return <div data-tid='hold-bags-short-info' />;
    },
}));

const mockedOfferUnavailable = isShortlistOfferUnavailable as jest.MockedFn<typeof isShortlistOfferUnavailable>;

describe('<HolidayFlightDetails />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        mockProps = createProps();
    });

    describe('HolidayFlightDetails should render', () => {
        it('Should standard', () => {
            render(<HolidayFlightDetails {...mockProps} />);

            expect(screen.getByTestId('holiday-details')).toBeInTheDocument();
            expect(screen.getByTestId('departure-airport')).toBeInTheDocument();
            expect(screen.getByTestId('holiday-dates')).toBeInTheDocument();
            expect(screen.getByTestId('hold-bags-short-info')).toBeInTheDocument();
            expect(mockHoldBagsShortInfo).toHaveBeenCalledWith({
                luggageCount: mockProps.luggageCount,
                luggageText: mockProps.luggageText,
                packageIcons: undefined,
                extraLuggageItems: [],
            });
            expect(screen.getByTestId('arrival-airport')).toBeInTheDocument();
            expect(screen.getByTestId('nights-count')).toBeInTheDocument();
            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalled();
        });

        it('Should render signular night', () => {
            mockProps.night = 1;

            render(<HolidayFlightDetails {...mockProps} />);

            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
                SitecoreDictionary.GlobalsLabelsNightSingular,
            );
        });

        it('Should render mobile', () => {
            mockStores.appStore.isScreenMedium = false;

            render(<HolidayFlightDetails {...mockProps} />);

            expect(screen.getByTestId('holiday-info')).toBeInTheDocument();
        });

        describe('holiday info', () => {
            it('Should render holiday info with depDate from routeDep when isRecommendedOffer', () => {
                mockProps.isRecommendedOffer = true;
                render(<HolidayFlightDetails {...mockProps} />);

                expect(screen.getByTestId('holiday-info')).toHaveTextContent(
                    'Tenerife Airport - 19 Sep 2020 - 7 Globals.Labels.NightsPlural',
                );
            });

            it('Should render holiday info with offer date when isRecommendedCarousel (isParentOffer is truthy) and offer date is defined', () => {
                mockProps.isParentOffer = true;
                mockProps.routeDep = {
                    ...mockedTransport.routes[1],
                    depDate: '',
                };
                mockProps.offer = mockedOffer;
                render(<HolidayFlightDetails {...mockProps} />);

                expect(screen.getByTestId('holiday-info')).toHaveTextContent(
                    'Tenerife Airport - 10 Dec 2029 - 7 Globals.Labels.NightsPlural',
                );
            });

            it('Should render holiday info with offer date when isRecommendedCarousel (isRecommendedOffer is truthy) and offer date is defined', () => {
                mockProps.isRecommendedOffer = true;
                mockProps.routeDep = {
                    ...mockedTransport.routes[1],
                    depDate: '',
                };
                mockProps.offer = mockedOffer;
                render(<HolidayFlightDetails {...mockProps} />);

                expect(screen.getByTestId('holiday-info')).toHaveTextContent(
                    'Tenerife Airport - 10 Dec 2029 - 7 Globals.Labels.NightsPlural',
                );
            });
        });

        it('Should render rooms value when only 1 room', () => {
            mockStores.appStore.isScreenMedium = false;
            mockProps.isRecommendedOffer = true;
            mockProps.offer = {
                accom: {
                    unit: [{ occupation: { adults: 2 } }],
                },
            } as any;

            render(<HolidayFlightDetails {...mockProps} />);

            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.GlobalsLabelsRoom);
        });

        it('Should render rooms value when multiple rooms', () => {
            mockStores.appStore.isScreenMedium = false;
            mockProps.isRecommendedOffer = true;
            mockProps.offer = {
                accom: {
                    unit: [{ occupation: { adults: 2 } }, { occupation: { adults: 2 } }],
                },
            } as any;

            render(<HolidayFlightDetails {...mockProps} />);

            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.GlobalsLabelsRooms);
        });

        it('Should render who value', () => {
            mockStores.appStore.isScreenMedium = false;
            mockProps.isRecommendedOffer = true;
            mockProps.offer = {
                accom: {
                    unit: [{ occupation: { adults: 2, children: 2, infants: 2 } }],
                },
            } as any;

            render(<HolidayFlightDetails {...mockProps} />);

            expect(getNumberOfGuestsByCategory).toHaveBeenCalledWith(mockStores.layoutStore.getPhrase, 2, 2, 2);
        });

        it('should render HoldBagsShortInfo for carousel when isRecommendedOffer = true', () => {
            mockProps.offer = { ...mockedOffer, extraLuggageInfo: extraLuggageInfoMock };
            mockProps.packageIcons = mockHotel.theme.packageIcons;
            mockProps.isRecommendedOffer = true;

            render(<HolidayFlightDetails {...mockProps} />);

            expect(mockHoldBagsShortInfo).toHaveBeenCalledWith({
                luggageCount: mockProps.luggageCount,
                luggageText: mockProps.luggageText,
                packageIcons: mockProps.packageIcons,
                extraLuggageItems: extraLuggageInfoMock.items,
            });
            expect(screen.getByTestId('hold-bags-short-info')).toBeInTheDocument();
        });

        it('should render HoldBagsShortInfo for carousel when isParentOffer = true', () => {
            mockProps.offer = { ...mockedOffer, extraLuggageInfo: extraLuggageInfoMock };
            mockProps.packageIcons = mockHotel.theme.packageIcons;
            mockProps.isParentOffer = true;

            render(<HolidayFlightDetails {...mockProps} />);

            expect(mockHoldBagsShortInfo).toHaveBeenCalledWith({
                luggageCount: mockProps.luggageCount,
                luggageText: mockProps.luggageText,
                packageIcons: mockProps.packageIcons,
                extraLuggageItems: extraLuggageInfoMock.items,
            });
            expect(screen.getByTestId('hold-bags-short-info')).toBeInTheDocument();
        });
    });

    describe('HolidayFlightDetails for shortList', () => {
        it('Should render dates if shortlist offer is available', () => {
            mockProps.offer = { accom: { theme: {} } } as IOffer;
            mockStores.layoutStore.isShortlistPage = true;
            mockedOfferUnavailable.mockReturnValueOnce(false);

            render(<HolidayFlightDetails {...mockProps} />);

            expect(screen.getByTestId('holiday-dates')).toBeInTheDocument();
        });

        it('Should not render dates if shortlist offer is not available', () => {
            mockProps.offer = { accom: { theme: {} } } as IOffer;
            mockStores.layoutStore.isShortlistPage = true;
            mockedOfferUnavailable.mockReturnValueOnce(true);

            render(<HolidayFlightDetails {...mockProps} />);

            expect(screen.queryByTestId('holiday-dates')).not.toBeInTheDocument();
        });
    });
});
