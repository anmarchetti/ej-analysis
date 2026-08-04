import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import settings from 'code/settings';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import SitePath from 'models/enum/SitePath';
import { AlternativeFlights } from 'frontend/components/renderings/AlternativeFlights/AlternativeFlights';

jest.mock('guid-typescript', () => ({ Guid: { create: jest.fn(() => mockGuid) } }));

jest.mock('scroll-into-view-if-needed', () => ({
    __esModule: true,
    default: jest.fn((ref, options) => {
        if (typeof options.behavior !== 'string') {
            options.behavior([{ el: { scrollTop: 0 }, top: 10 }]);

            return ref;
        }
    }),
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: () => <div data-tid='sitecore-text' />,
}));

jest.mock('./components/FlightCard', () => ({
    __esModule: true,
    default: ({ onClickChange, onClickSelect }) => (
        <div>
            <button onClick={onClickChange} onKeyDown={jest.fn()} data-tid='flight-card' />
            <button onClick={onClickSelect} onKeyDown={jest.fn()} data-tid='flight-card-select' />
        </div>
    ),
}));

jest.mock('./components/FlightShimmer', () => ({
    __esModule: true,
    default: () => <div data-tid='flight-shimmer' />,
}));

jest.mock('./components/AlternativeFlightsDrawer', () => ({
    __esModule: true,
    default: ({ onCancelChanges, onConfirmChanges, onClickSelect }) => (
        <div data-tid='alternative-flights-drawer'>
            <button onClick={onCancelChanges} onKeyDown={jest.fn()} data-tid='alternative-drawer-cancel' />
            <button onClick={onConfirmChanges} onKeyDown={jest.fn()} data-tid='alternative-drawer-confirm' />
            <button onClick={onClickSelect} onKeyDown={jest.fn()} data-tid='alternative-drawer-select' />
        </div>
    ),
}));

const mockAlternativeFlightsList = jest.fn();
jest.mock('./components/AlternativeFlightsList', () => ({
    __esModule: true,
    default: ({ seatsReservationNotification, onClickSelect, ...props }) => {
        mockAlternativeFlightsList(props);

        return (
            <button data-tid='alternative-flights-list' onClick={onClickSelect} onKeyDown={jest.fn()}>
                {seatsReservationNotification}
            </button>
        );
    },
}));

const mockErrorMessageComponent = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => props => {
    mockErrorMessageComponent(props);

    return <div data-tid='error-message' />;
});

const mockPriceChangeBanner = jest.fn();
jest.mock('frontend/components/common/PriceChangeBanner/PriceChangeBanner', () => props => {
    mockPriceChangeBanner(props);

    return <div data-tid='price-change-banner' />;
});

let historyListener;
let routerMock;
let mockGuid;

const offerMock = {
    pricePP: 100,
    accom: {
        code: 'test',
        packageId: 'packageId',
        unit: [mockedOffer.accom.unit[0]],
    },
    date: '2019-08-22T00:00:00',
    transport: {
        routes: [
            {
                id: '170430/2979',
                cycDate: '2019-08-22',
                depPt: 'LGW',
                arrPt: 'PMI',
                arrDate: '2019-08-22T14:00:00',
                routeCd: 'PMILGW4ALGWPMI',
                avail: 177,
                fltNo: 'EZY791',
                car: 'EZY',
                direction: 'outbound',
                depDate: '2019-08-22T11:30:00',
                arrName: 'arrName',
                depName: 'depName',
            } as IRoute,
            {
                id: '170430/2978',
                cycDate: '2019-08-22',
                depPt: 'LGW',
                arrPt: 'PMI',
                arrDate: '2019-08-22T14:00:00',
                routeCd: 'PMILGW4ALGWPMI',
                avail: 177,
                fltNo: 'EZY791',
                car: 'EZY',
                direction: 'inbound',
                depDate: '2019-08-22T11:30:00',
                arrName: 'arrName',
                depName: 'depName',
            } as IRoute,
        ],
    },
} as IOfferWithoutAltBoards;

const offerMock2 = {
    pricePP: 100,
    accom: {
        code: 'test',
        packageId: 'packageId',
        unit: [mockedOffer.accom.unit[0]],
    },
    date: '2019-08-22T00:00:00',
    transport: {
        routes: [
            {
                id: '123456',
                cycDate: '2019-08-22',
                depPt: 'LGW',
                arrPt: 'PMI',
                arrDate: '2019-08-22T14:00:00',
                routeCd: 'PMILGW4ALGWPMI',
                avail: 177,
                fltNo: 'EZY791',
                car: 'EZY',
                direction: 'outbound',
                depDate: '2019-08-22T11:30:00',
                arrName: 'arrName',
                depName: 'depName',
            } as IRoute,
            {
                id: '12345',
                cycDate: '2019-08-22',
                depPt: 'LGW',
                arrPt: 'PMI',
                arrDate: '2019-08-22T14:00:00',
                routeCd: 'PMILGW4ALGWPMI',
                avail: 177,
                fltNo: 'EZY791',
                car: 'EZY',
                direction: 'inbound',
                depDate: '2019-08-22T11:30:00',
                arrName: 'arrName',
                depName: 'depName',
            } as IRoute,
        ],
    },
} as IOfferWithoutAltBoards;

describe('AlternativeFlights', () => {
    const resetMocks = () => ({
        offer: offerMock,
        alternativeFlights: [offerMock, offerMock2],
        isLoadingFlights: false,
        isFailedToLoadFlights: false,
        isFailedToLoadOffer: false,

        isLoadingOffer: false,

        isScreenExtraSmall: false,

        onChangeFlight: jest.fn(),
        fetchOfferAndReloadPage: jest.fn().mockImplementation(() => Promise.resolve()),

        alterativeFlightsDate: null,

        fields: {
            data: {
                Title: mockSitecoreField('Title'),
                ShowPriceGraph: mockSitecoreField(true),
                ReservationNotificationTitle: mockSitecoreField('Prices shown without seat reservations'),
                ReservationNotificationDescription: mockSitecoreField(
                    'The alternative flight prices shown below do not include the seats you have reserved at a value of 50. If you change your flights, you will have to pick new seats',
                ),
            },
        },
        params: { Anchor: '567', IsExpanded: false },
        rendering: {},
        getPhrase: jest.fn(),
        getSetting: jest.fn(),
        initFlightsFilters: jest.fn(),
        sortAndFilterFlights: jest.fn(flights => flights),
        clearSelectedFilters: jest.fn(),
        filterFlights: jest.fn(p => p),
        setFilterOptionsCounts: jest.fn(),
        formatMoney: jest.fn(),
        loadAlternativeFlights: jest.fn(),
        rerenderMap: jest.fn(),
        currentOffer: {},
        flights: [offerMock, offerMock2],
        isLoadingOfferForNewDate: false,
        showFlights: 2,
        setShowFlights: jest.fn(),
        originalFlightsOrdering: ['test', 'test'],
        setFlights: jest.fn(),
        resetOriginals: jest.fn(),
        ...routerMock,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        historyListener = jest.fn();
        routerMock = {
            location: {
                pathname: SitePath.Extras,
            },
            match: {},
            history: {
                listen: () => historyListener,
                push: jest.fn(),
                replace: jest.fn(),
                location: {
                    pathname: SitePath.Extras,
                },
            },
        };
        mocks = resetMocks();
        mockGuid = 'guid-123';
    });

    it('should render collapsed component correctly', () => {
        const { rerender } = render(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('alternative-flights-list')).not.toBeInTheDocument();

        rerender(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('alternative-flights-list')).not.toBeInTheDocument();
    });

    it('should render "Failed to load flights" if failed to load alternative flights', () => {
        mocks.isFailedToLoadFlights = true;

        render(<AlternativeFlights {...mocks} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.queryByTestId('alternative-flights-list')).not.toBeInTheDocument();
    });

    it('should render null if failed to load active offer info', () => {
        mocks.isFailedToLoadOffer = true;
        mocks.params.IsExpanded = true;

        render(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('alternative-flights-content')).not.toBeInTheDocument();
    });

    it('should render null if no offer found', () => {
        mocks.offer = null;
        mocks.isFailedToLoadFlights = true;
        mocks.params.IsExpanded = true;

        render(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('alternative-flights-content')).not.toBeInTheDocument();
    });

    it('should render null if it was no flight for other date', () => {
        mocks.flights = [];

        render(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('alternative-flights-content')).not.toBeInTheDocument();
    });

    it('should create id from Guid if no params', () => {
        mocks.params = null;
        const { rerender } = render(<AlternativeFlights {...mocks} />);

        rerender(<AlternativeFlights {...mocks} />);

        expect(screen.getByTestId('alt-flights-section')).toHaveAttribute('id', mockGuid);
    });

    it('should create id from params', () => {
        const { rerender } = render(<AlternativeFlights {...mocks} />);

        rerender(<AlternativeFlights {...mocks} />);

        expect(screen.getByTestId('alt-flights-section')).toHaveAttribute('id', mocks.params.Anchor);
    });

    it('should render step title', () => {
        const { rerender } = render(<AlternativeFlights {...mocks} />);

        rerender(<AlternativeFlights {...mocks} />);

        expect(screen.getByTestId('sitecore-text')).toBeInTheDocument();
    });

    it('should NOT render step title if NO Title field', () => {
        delete mocks.fields.data.Title;
        const { rerender } = render(<AlternativeFlights {...mocks} />);

        rerender(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('sitecore-text')).not.toBeInTheDocument();
    });

    it('should NOT render AlternativeFlightsList if flights length === 0', () => {
        mocks.flights = [];

        const { rerender } = render(<AlternativeFlights {...mocks} />);

        rerender(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('alternative-flights-content')).not.toBeInTheDocument();
    });

    it('should NOT render FlightShimmer if flights is NOT loading', () => {
        const { rerender } = render(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('flight-shimmer')).not.toBeInTheDocument();

        rerender(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('flight-shimmer')).not.toBeInTheDocument();
    });

    it('should NOT render FlightShimmer if screen is small', () => {
        mocks.isScreenExtraSmall = true;

        const { rerender } = render(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('flight-shimmer')).not.toBeInTheDocument();

        rerender(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('flight-shimmer')).not.toBeInTheDocument();
    });

    it('should render flight card when flights are NOT loading and flights.length > 0', () => {
        mocks.flights = [offerMock];

        render(<AlternativeFlights {...mocks} />);

        expect(screen.getByTestId('flight-card')).toBeInTheDocument();
    });

    it('should set isExpanded to true on flight card click', async () => {
        const { rerender } = render(<AlternativeFlights {...mocks} />);

        rerender(<AlternativeFlights {...mocks} />);

        expect(screen.queryByTestId('alternative-flights-list')).not.toBeInTheDocument();

        await userEvent.click(screen.getByTestId('flight-card'));

        rerender(<AlternativeFlights {...mocks} />);

        expect(screen.getByTestId('alternative-flights-list')).toBeInTheDocument();
    });

    it('should call onChangeFlight on FlightCard onClickSelect', async () => {
        const { rerender } = render(<AlternativeFlights {...mocks} />);

        rerender(<AlternativeFlights {...mocks} />);

        await userEvent.click(screen.getByTestId('flight-card-select'));

        expect(mocks.onChangeFlight).toHaveBeenCalled();
    });

    describe('PriceChange banner', () => {
        beforeEach(() => {
            mocks.isSeatMapFlowEnabled = true;
            mocks.isHotelDetailsBookPage = true;
            mocks.haveSelectedSeats = true;
            mocks.params.IsExpanded = '1';
            mocks.extraLuggagePriceTotal = 20;
            mocks.selectedSeatsPrice = 30;
        });

        it("should NOT render when AlternativeFlightsList doesn't expanded", () => {
            mocks.params.IsExpanded = undefined;

            const { rerender } = render(<AlternativeFlights {...mocks} />);

            rerender(<AlternativeFlights {...mocks} />);

            expect(screen.getByTestId('alt-flights-section')).toBeInTheDocument();
            expect(screen.queryByTestId('alternative-flights-list')).not.toBeInTheDocument();
            expect(screen.queryByTestId('price-change-banner')).not.toBeInTheDocument();
        });

        it('should render and correctly count price when AlternativeFlightsList expanded on hotelDetails page', () => {
            mocks.currentOffer = offerMock;

            const { rerender } = render(<AlternativeFlights {...mocks} />);

            rerender(<AlternativeFlights {...mocks} />);

            expect(screen.getByTestId('alt-flights-section')).toBeInTheDocument();
            expect(screen.getByTestId('alternative-flights-list')).toBeInTheDocument();
            expect(screen.getByTestId('price-change-banner')).toBeInTheDocument();
            expect(mockPriceChangeBanner).toBeCalledWith({
                ReservationNotificationTitle: mocks.fields.data.ReservationNotificationTitle,
                ReservationNotificationDescription: mocks.fields.data.ReservationNotificationDescription,
            });

            expect(mockAlternativeFlightsList).toHaveBeenCalledWith({
                offer: offerMock,
                altRoutes: [offerMock2],
                totalFlights: 1,
                isFlightSelected: expect.any(Function),
                isShowLessVisible: false,
                isShowMoreVisible: false,
                nextFlightIndex: 0,
                nextFlightRef: {
                    current: null,
                },
                onClickShowLess: expect.any(Function),
                onClickShowMore: expect.any(Function),
                showMoreRef: {
                    current: null,
                },
            });
        });

        it('should render AlternativeFlightsList with showMoreVisible as true and sorted offers', () => {
            mocks.currentOffer = offerMock2;
            mocks.flights = [offerMock, offerMock2, offerMock, offerMock2];

            const { rerender } = render(<AlternativeFlights {...mocks} />);

            rerender(<AlternativeFlights {...mocks} />);

            expect(mockAlternativeFlightsList).toHaveBeenCalledWith({
                offer: offerMock2,
                altRoutes: [offerMock, offerMock2],
                totalFlights: 3,
                isFlightSelected: expect.any(Function),
                isShowLessVisible: false,
                isShowMoreVisible: true,
                nextFlightIndex: 0,
                nextFlightRef: {
                    current: null,
                },
                onClickShowLess: expect.any(Function),
                onClickShowMore: expect.any(Function),
                showMoreRef: {
                    current: null,
                },
            });
        });

        it('should call onChangeFlight on AlternativeFlightsList click', async () => {
            const { rerender } = render(<AlternativeFlights {...mocks} />);

            rerender(<AlternativeFlights {...mocks} />);

            await userEvent.click(screen.getByTestId('alternative-flights-list'));

            expect(mocks.onChangeFlight).toHaveBeenCalled();
        });
    });

    describe('AlternativeFlightsDrawer', () => {
        beforeEach(() => {
            mocks.isScreenExtraSmall = true;
        });

        it('should render AlternativeFlightsDrawer when isScreenExtraSmall is true and isFailedToLoadFlights is false', () => {
            const { rerender } = render(<AlternativeFlights {...mocks} />);
            rerender(<AlternativeFlights {...mocks} />);

            expect(screen.getByTestId('alternative-flights-drawer')).toBeInTheDocument();
        });

        it('should call scrollIntoViewIfNeeded on alternative drawer cancel click', async () => {
            const { rerender } = render(<AlternativeFlights {...mocks} />);
            rerender(<AlternativeFlights {...mocks} />);

            await userEvent.click(screen.getByTestId('alternative-drawer-cancel'));

            expect(scrollIntoViewIfNeeded).toHaveBeenCalledWith(expect.any(HTMLElement), {
                block: 'start',
                behavior: expect.any(Function),
            });
        });

        it('should call scrollIntoViewIfNeeded and fetchOfferAndReloadPage on alternative drawer confirm click', async () => {
            const { rerender } = render(<AlternativeFlights {...mocks} />);
            rerender(<AlternativeFlights {...mocks} />);

            await userEvent.click(screen.getByTestId('alternative-drawer-confirm'));

            expect(scrollIntoViewIfNeeded).toHaveBeenCalledWith(expect.any(HTMLElement), {
                block: 'start',
                behavior: expect.any(Function),
            });
        });

        it('should call onChangeFlight on alternative drawer select click', async () => {
            const { rerender } = render(<AlternativeFlights {...mocks} />);
            rerender(<AlternativeFlights {...mocks} />);

            await userEvent.click(screen.getByTestId('alternative-drawer-select'));

            expect(mocks.onChangeFlight).toHaveBeenCalled();
        });
    });

    describe('componentDidUpdate', () => {
        let component;
        const mockInitFilters = jest.fn();
        const mockToggleFlightsSection = jest.fn();

        beforeEach(() => {
            component = new AlternativeFlights({ ...mocks });
            component.initFilters = mockInitFilters;
            component.toggleFlightsSection = mockToggleFlightsSection;
        });

        it('should call initFilters and resetOriginals when offer from props is provided, offer from prevProps in undefined and originalFlightsOrdering length is higher than 0', () => {
            mocks.originalFlightsOrdering = ['', ''];

            component.componentDidUpdate({ offer: undefined });

            expect(mockInitFilters).toHaveBeenCalled();
            expect(mocks.resetOriginals).toHaveBeenCalled();
        });

        it('should call resetOriginals when needResetOriginals is true', () => {
            jest.spyOn(component, 'needResetOriginals', 'get').mockReturnValue(true);

            component.componentDidUpdate({ offer: {} });

            expect(mocks.resetOriginals).toHaveBeenCalled();
        });

        it('should call setFlights when alternativeFlights changed, originalFlightsOrdering length is bigger than 0 and isLoadingOfferForNewDate is false', () => {
            mocks.originalFlightsOrdering = ['', ''];
            mocks.isLoadingOfferForNewDate = false;

            component.componentDidUpdate({ alternativeFlights: {} });

            expect(mocks.setFlights).toHaveBeenCalled();
        });

        it('should call toggleFlightsSection when isScreenExtraSmall is changed', async () => {
            component.componentDidUpdate({ isScreenExtraSmall: true });

            await waitFor(() => expect(mockToggleFlightsSection).toHaveBeenCalled());
        });
    });

    describe('showMore', () => {
        let component;

        beforeEach(() => {
            component = new AlternativeFlights({ ...mocks });
        });

        it('should call scrollIntoViewIfNeeded when nextFlightRef is provided', async () => {
            component.nextFlightRef = { current: {} };

            component.showMore();

            await waitFor(() =>
                expect(scrollIntoViewIfNeeded).toHaveBeenCalledWith(component.nextFlightRef.current, {
                    behavior: 'smooth',
                    block: 'center',
                }),
            );
        });

        it('should call scrollIntoViewIfNeeded when showMoreRef is provided', async () => {
            mocks.isScreenExtraSmall = true;
            component.nextFlightRef = undefined;
            component.showMoreRef = { current: {} };

            component.showMore();

            await waitFor(() =>
                expect(scrollIntoViewIfNeeded).toHaveBeenCalledWith(component.showMoreRef.current, {
                    behavior: 'smooth',
                    block: 'center',
                }),
            );
        });

        it('should NOT call scrollIntoViewIfNeeded when showMoreRef and nextFlightRef are NOT provided', async () => {
            component.nextFlightRef = undefined;
            component.showMoreRef = undefined;

            component.showMore();

            await waitFor(() => expect(scrollIntoViewIfNeeded).not.toHaveBeenCalled());
        });
    });

    describe('showLess', () => {
        let component;

        beforeEach(() => {
            component = new AlternativeFlights({ ...mocks });
        });

        it('should call scrollIntoViewIfNeeded when showLessMobileRef is provided and isScreenExtraSmall', () => {
            mocks.isScreenExtraSmall = true;

            component = new AlternativeFlights({ ...mocks });
            component.showLessMobileRef = { current: {} };

            component.showLess();

            expect(scrollIntoViewIfNeeded).toHaveBeenCalledWith(component.showLessMobileRef.current, {
                behavior: 'smooth',
                block: 'center',
            });
        });

        it('should call scrollIntoViewIfNeeded when showLessRef is provided and isScreenExtraSmall is false', () => {
            component.showLessRef = { current: {} };

            component.showLess();

            expect(scrollIntoViewIfNeeded).toHaveBeenCalledWith(component.showLessRef.current, {
                behavior: 'smooth',
                block: 'center',
            });
        });

        it('should NOT call scrollIntoViewIfNeeded when showLessRef is NOT provided and isScreenExtraSmall is false', () => {
            component.showLess();

            expect(scrollIntoViewIfNeeded).not.toHaveBeenCalled();
            expect(mocks.setShowFlights).toHaveBeenCalledWith(settings.AlternativeFlights.FirstPageFlightsNumber);
        });
    });
});
