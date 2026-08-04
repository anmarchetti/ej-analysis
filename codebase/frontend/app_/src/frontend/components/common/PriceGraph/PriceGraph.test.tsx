import React from 'react';
import { render } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { mockAccomData } from 'frontend/__mocks__';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';

import PriceGraphSettings from './constants';
import { IPriceGraphProps, PriceGraph } from './PriceGraph';

const originalScroll = (HTMLElement.prototype as any).scroll;

beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scroll', {
        configurable: true,
        writable: true,
        value: jest.fn(),
    });
});

afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scroll', {
        configurable: true,
        writable: true,
        value: originalScroll,
    });
});

jest.mock('./components/Navigation/GraphNavigation', () => ({
    __esModule: true,
    default: () => <div data-tid='graph-navigation' />,
}));

jest.mock('./BarChart', () => ({
    __esModule: true,
    default: () => <div data-tid='bar-chart' />,
}));

const mockShimmerProps = jest.fn();
jest.mock('./components/Shimmer/PriceGraphShimmer', () => ({
    __esModule: true,
    default: (props: any) => {
        mockShimmerProps(props);

        return <div data-tid='price-graph-shimmer' />;
    },
}));

jest.mock('./MobileYAxis', () => ({
    __esModule: true,
    default: () => <div data-tid='mobile-y-axis' />,
}));

const mockGetEdgeAvailableDate = jest.fn();
jest.mock('./priceGraphUtils', () => {
    const actual = jest.requireActual('./priceGraphUtils');

    return {
        ...actual,
        getEdgeAvailableDate: (...args: any[]) => mockGetEdgeAvailableDate(...args),
    };
});

const mockBarChartProps = jest.fn();
jest.mock('./BarChart', () => ({
    __esModule: true,
    default: (props: any) => {
        mockBarChartProps(props);

        return <div data-tid='bar-chart' />;
    },
}));

const renderWithRef = (props: IPriceGraphProps) => {
    const ref = React.createRef<PriceGraph>();

    const utils = render(<PriceGraph ref={ref} {...props} />);

    return { ...utils, ref };
};

describe('<PriceGraph />', () => {
    const resetMocks = () => {
        const defaultAltOfferProps = {
            accom: mockAccomData,
            date: '2020-01-31T00:00:00',
            hasDistressedFlights: false,
            id: '123',
            price: 1134.92,
            pricePP: 567.46,
            stay: 2,
            transfers: [],
            transport: {
                routes: [],
            },
        };

        return {
            numTotalPrice: 100,
            hideInfoMessage: false,
            isExternalHotel: false,
            getPhrase: jest.fn(),
            isScreenLarge: false,
            isScreenExtraLarge: true,
            isMobileView: false,
            alternativeOffers: [
                {
                    ...defaultAltOfferProps,
                    date: '2020-01-30T00:00:00',
                    price: 1130.92,
                    pricePP: 565.46,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-01-31T00:00:00',
                    price: 1134.92,
                    pricePP: 567.46,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-01T00:00:00',
                    price: 1135.92,
                    pricePP: 567.96,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-02T00:00:00',
                    price: 1169.92,
                    pricePP: 584.96,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-03T00:00:00',
                    price: 1123.92,
                    pricePP: 561.96,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-04T00:00:00',
                    price: 1108.25,
                    pricePP: 554.13,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-05T00:00:00',
                    price: 1078.57,
                    pricePP: 539.29,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-06T00:00:00',
                    price: 1080.22,
                    pricePP: 540.11,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-07T00:00:00',
                    price: 1085.86,
                    pricePP: 542.93,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-08T00:00:00',
                    price: 1079.86,
                    pricePP: 539.93,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-09T00:00:00',
                    price: 1123.25,
                    pricePP: 561.63,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-10T00:00:00',
                    price: 1166.65,
                    pricePP: 583.33,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-11T00:00:00',
                    price: 1206.39,
                    pricePP: 603.2,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-12T00:00:00',
                    price: 1276.14,
                    pricePP: 638.07,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-13T00:00:00',
                    price: 1376.05,
                    pricePP: 688.03,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-14T00:00:00',
                    price: 1376.05,
                    pricePP: 688.03,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-15T00:00:00',
                    price: 1376.05,
                    pricePP: 688.03,
                },
                {
                    ...defaultAltOfferProps,
                    date: '2020-02-16T00:00:00',
                    price: 1376.05,
                    pricePP: 688.03,
                },
            ],
            loadAlternativeOffers: jest.fn(),
            middleDate: new Date('2020-02-06T00:00:00'),
            selectedDate: new Date('2020-02-06T00:00:00'),
            holidayDuration: 2,
            isLoadingAlternativeDates: false,
            offerCode: 'test',
            changeActiveDate: jest.fn(),
            resetToInitial: jest.fn(),
            getSetting: jest.fn(),
            getSettingAsNumber: jest.fn(() => 3),
            currency: CurrencyCode.GBP,
            formatMoney: jest.fn(),
        } as unknown as IPriceGraphProps;
    };

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockGetEdgeAvailableDate.mockReturnValue(new Date('2100-01-01T00:00:00'));
    });

    it('should render GraphNavigation if screen is NOT small', () => {
        const { getByTestId } = renderWithRef(mocks);

        expect(getByTestId('graph-navigation')).toBeInTheDocument();
    });

    it('should not render GraphNavigation if screen is small', () => {
        mocks.isMobileView = true;

        const { queryByTestId } = renderWithRef(mocks);

        expect(queryByTestId('graph-navigation')).not.toBeInTheDocument();
    });

    it('should render PriceGraphShimmer if alternative dates are loading', () => {
        mocks.isLoadingAlternativeDates = true;
        const { queryByTestId, container } = renderWithRef(mocks);

        expect(queryByTestId('price-graph-shimmer')).toBeInTheDocument();
        // width only on desktop
        expect(mockShimmerProps).toHaveBeenLastCalledWith(
            expect.objectContaining({ width: 'calc(100% - 32px - 32px)' }),
        );
        expect(container.querySelector('.graph-container')).not.toBeInTheDocument();
    });

    it('should render PriceGraphShimmer without width prop on mobile', () => {
        mocks.isLoadingAlternativeDates = true;
        mocks.isMobileView = true;

        renderWithRef(mocks);
        expect(mockShimmerProps).toHaveBeenLastCalledWith(expect.not.objectContaining({ width: expect.anything() }));
    });

    it('should render PriceGraphShimmer if no alternative offers (desktop)', () => {
        mocks.isMobileView = false;
        mocks.alternativeOffers = [];

        const { queryByTestId, container } = renderWithRef(mocks);

        expect(queryByTestId('price-graph-shimmer')).toBeInTheDocument();
        expect(container.querySelector('.graph-container')).not.toBeInTheDocument();
    });

    it('should render PriceGraphShimmer if no alternative offers (mobile)', () => {
        mocks.isMobileView = true;
        mocks.alternativeOffers = [];

        const { queryByTestId, container } = renderWithRef(mocks);

        expect(queryByTestId('price-graph-shimmer')).toBeInTheDocument();
        expect(container.querySelector('.graph-container')).not.toBeInTheDocument();
    });

    it('should render MobileYAxis if screen is small', () => {
        mocks.isMobileView = true;

        const { getByTestId } = renderWithRef(mocks);

        expect(getByTestId('mobile-y-axis')).toBeInTheDocument();
    });

    describe('componentWillUnmount', () => {
        it('should run resetToInitial (desktop) and NOT removeEventListener', () => {
            const { ref, unmount } = renderWithRef(mocks);

            const removeSpy = jest.fn();
            (ref.current as any).graphWrapper.current = {
                removeEventListener: removeSpy,
            };

            unmount();

            expect(mocks.resetToInitial).toHaveBeenCalled();
            expect(removeSpy).not.toHaveBeenCalled();
        });

        it('should run resetToInitial (mobile) and removeEventListener', () => {
            mocks.isMobileView = true;

            const { ref, unmount } = renderWithRef(mocks);

            const removeSpy = jest.fn();
            (ref.current as any).graphWrapper.current = {
                removeEventListener: removeSpy,
            };

            unmount();

            expect(mocks.resetToInitial).toHaveBeenCalled();
            expect(removeSpy).toHaveBeenCalled();
        });
    });

    describe('showPrevDates', () => {
        beforeEach(() => {
            mockGetEdgeAvailableDate.mockReturnValue(new Date('2020-01-22T00:00:00'));
        });

        it('should call showOtherDates (desktop)', () => {
            const { ref } = renderWithRef(mocks);
            const spy = jest.spyOn(ref.current as any, 'showOtherDates');

            (ref.current as any).showNewDates();

            expect(spy).toHaveBeenCalledWith(new Date('2020-01-22T00:00:00'), new Date('2020-01-30T00:00:00'), false);
        });

        it('should calculate nextFirstShowDate from first alternative offer date (mobile)', () => {
            mocks.isMobileView = true;
            const { ref } = renderWithRef(mocks);
            const spy = jest.spyOn(ref.current as any, 'showOtherDates');

            (ref.current as any).showNewDates();

            expect(spy).toHaveBeenCalledWith(new Date('2020-01-22T00:00:00'), new Date('2020-01-27T00:00:00'), false);
        });
    });

    describe('showNextDates', () => {
        beforeEach(() => {
            mockGetEdgeAvailableDate.mockReturnValue(new Date('2020-02-21T00:00:00'));
        });

        it('should call showOtherDates (desktop)', () => {
            const { ref } = renderWithRef(mocks);
            const spy = jest.spyOn(ref.current as any, 'showOtherDates');

            (ref.current as any).showNewDates(true);

            expect(spy).toHaveBeenCalledWith(new Date('2020-02-21T00:00:00'), new Date('2020-02-13T00:00:00'), true);
        });

        it('should calculate nextLastShowDate from last alternative offer date (mobile)', () => {
            mocks.isMobileView = true;
            const { ref } = renderWithRef(mocks);
            const spy = jest.spyOn(ref.current as any, 'showOtherDates');

            (ref.current as any).showNewDates(true);

            expect(spy).toHaveBeenCalledWith(new Date('2020-02-21T00:00:00'), new Date('2020-02-19T00:00:00'), true);
        });
    });

    describe('isNextBtnAvailable', () => {
        it('returns false when last show date >= last available date', () => {
            mockGetEdgeAvailableDate.mockReturnValue(new Date('2020-01-22T00:00:00'));
            mocks.alternativeOffers = [{}, {}, { date: '2020-02-06T00:00:00' }] as IAlternativeOffer[];

            const { ref } = renderWithRef(mocks);
            expect((ref.current as any).isNextBtnAvailable).toBe(false);
        });

        it('returns true when last show date < last available date', () => {
            mockGetEdgeAvailableDate.mockReturnValue(new Date('2020-02-06T00:00:00'));
            mocks.alternativeOffers = [{}, {}, { date: '2020-02-03T00:00:00' }] as IAlternativeOffer[];

            const { ref } = renderWithRef(mocks);
            expect((ref.current as any).isNextBtnAvailable).toBe(true);
        });
    });

    describe('isPrevBtnAvailable', () => {
        it('returns false when first show date <= first available date', () => {
            mockGetEdgeAvailableDate.mockReturnValue(new Date('2020-02-06T00:00:00'));
            mocks.alternativeOffers = [{ date: '2020-02-03T00:00:00' }, {}, {}] as IAlternativeOffer[];

            const { ref } = renderWithRef(mocks);
            expect((ref.current as any).isPrevBtnAvailable).toBe(false);
        });

        it('returns true when first show date > first available date', () => {
            mockGetEdgeAvailableDate.mockReturnValue(new Date('2020-02-03T00:00:00'));
            mocks.alternativeOffers = [{ date: '2020-02-06T00:00:00' }, {}, {}] as IAlternativeOffer[];

            const { ref } = renderWithRef(mocks);
            expect((ref.current as any).isPrevBtnAvailable).toBe(true);
        });
    });

    describe('datesToShow', () => {
        it('returns all 17+ dates on mobile', () => {
            mocks.isMobileView = true;
            mocks.alternativeOffers = new Array(17).fill({
                date: '2020-02-06T00:00:00',
                price: 100,
                pricePP: 50,
            });

            renderWithRef(mocks);
            expect(mockBarChartProps).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.any(Array) }));

            const lastProps = (mockBarChartProps as jest.Mock).mock.calls.slice(-1)[0][0];
            expect(lastProps.data.length).toBe(17);
        });

        it('returns 15 dates on desktop', () => {
            mocks.selectedDate = new Date('2020-02-06T00:00:00');
            mocks.middleDate = new Date('2020-02-06T00:00:00');

            renderWithRef(mocks);
            const lastProps = (mockBarChartProps as jest.Mock).mock.calls.slice(-1)[0][0];
            expect(lastProps.data.length).toBe(15);
        });
    });

    describe('getDaysDifference', () => {
        it('orders as availableEdgeDate, nextEdgeShowDate when isNext = true', () => {
            const { ref } = renderWithRef(mocks);
            const days = (ref.current as any)['getDaysDifference'](
                true,
                new Date('2020-02-06T00:00:00'),
                new Date('2020-02-20T00:00:00'),
            );
            expect(days).toBe(-14);
        });

        it('orders as nextEdgeShowDate, availableEdgeDate when isNext = false', () => {
            const { ref } = renderWithRef(mocks);
            const days = (ref.current as any)['getDaysDifference'](
                false,
                new Date('2020-02-06T00:00:00'),
                new Date('2020-02-20T00:00:00'),
            );
            expect(days).toBe(14);
        });
    });

    describe('calculateNewMiddleDate', () => {
        describe('desktop', () => {
            it('sum newMiddleDate + amountOfLoadingItems when daysDiff >= amount', () => {
                const { ref } = renderWithRef(mocks);
                const d = (ref.current as any)['calculateNewMiddleDate'](true, 5, new Date('2020-02-20T00:00:00'));
                expect(d).toEqual(new Date('2020-02-09T00:00:00'));
            });

            it('subtract when isNext=false and daysDiff >= amount', () => {
                const { ref } = renderWithRef(mocks);
                const d = (ref.current as any)['calculateNewMiddleDate'](false, 5, new Date('2020-02-20T00:00:00'));
                expect(d).toEqual(new Date('2020-02-03T00:00:00'));
            });

            it('sum daysDiff when daysDiff < amount (isNext=true)', () => {
                const { ref } = renderWithRef(mocks);
                const d = (ref.current as any)['calculateNewMiddleDate'](true, 1, new Date('2020-02-20T00:00:00'));
                expect(d).toEqual(new Date('2020-02-07T00:00:00'));
            });

            it('subtract daysDiff when daysDiff < amount (isNext=false)', () => {
                const { ref } = renderWithRef(mocks);
                const d = (ref.current as any)['calculateNewMiddleDate'](false, 1, new Date('2020-02-20T00:00:00'));
                expect(d).toEqual(new Date('2020-02-05T00:00:00'));
            });
        });

        describe('mobile', () => {
            beforeEach(() => {
                mocks.isMobileView = true;
            });

            it('daysDiff > 0 and isNext === true', () => {
                const { ref } = renderWithRef(mocks);
                const d = (ref.current as any)['calculateNewMiddleDate'](true, 1, new Date('2020-02-20T00:00:00'));
                expect(d).toEqual(new Date('2020-02-13T00:00:00'));
            });

            it('daysDiff > 0 and isNext === false', () => {
                const { ref } = renderWithRef(mocks);
                const d = (ref.current as any)['calculateNewMiddleDate'](false, 1, new Date('2020-02-20T00:00:00'));
                expect(d).toEqual(new Date('2020-02-27T00:00:00'));
            });

            it('daysDiff < 0 and isNext === true', () => {
                const { ref } = renderWithRef(mocks);
                const d = (ref.current as any)['calculateNewMiddleDate'](true, -1, new Date('2020-02-20T00:00:00'));
                expect(d).toEqual(new Date('2020-02-11T00:00:00'));
            });

            it('daysDiff < 0 and isNext === false', () => {
                const { ref } = renderWithRef(mocks);
                const d = (ref.current as any)['calculateNewMiddleDate'](false, -1, new Date('2020-02-20T00:00:00'));
                expect(d).toEqual(new Date('2020-02-04T00:00:00'));
            });
        });
    });

    describe('updateAfterLoadingNewData', () => {
        it('isNext === true (desktop)', () => {
            const { ref } = renderWithRef(mocks);
            (ref.current as any)['updateAfterLoadingNewData'](true);

            expect((ref.current as any)['startIdx']).toBe(0);
            expect((ref.current as any)['scrollDirection']).toBe('RIGHT');
        });

        it('isNext === false (desktop)', () => {
            const { ref } = renderWithRef(mocks);
            (ref.current as any)['updateAfterLoadingNewData'](false);

            expect((ref.current as any)['startIdx']).toBe(0);
            expect((ref.current as any)['scrollDirection']).toBe('LEFT');
        });

        it('isNext === true (mobile)', () => {
            mocks.isMobileView = true;
            const { ref } = renderWithRef(mocks);
            (ref.current as any)['updateAfterLoadingNewData'](true);

            expect((ref.current as any)['startIdx']).toBe(0);
        });

        it('isNext === false (mobile)', () => {
            mocks.isMobileView = true;
            const { ref } = renderWithRef(mocks);
            (ref.current as any)['updateAfterLoadingNewData'](false);

            expect((ref.current as any)['startIdx']).toBe(0);
        });
    });

    describe('componentDidUpdate', () => {
        it('calls loadData when selectedDate changes', () => {
            const { ref, rerender } = renderWithRef(mocks);
            const spy = jest.spyOn(ref.current as any, 'loadData');

            rerender(<PriceGraph ref={ref} {...mocks} selectedDate={new Date('2020-02-09T00:00:00')} />);
            expect(spy).toHaveBeenCalled();
        });

        it('calls resetToInitial when prev offers length === 0 and current > 0', () => {
            const start = { ...mocks, alternativeOffers: [] };
            const { ref, rerender } = renderWithRef(start as IPriceGraphProps);
            const spy = jest.spyOn(ref.current as any, 'resetToInitial');

            rerender(<PriceGraph ref={ref} {...mocks} />); // now length > 0

            expect(spy).toHaveBeenCalled();
        });

        it('saves prevAlternativeOffersLength on mobile when length changes', () => {
            mocks.isMobileView = true;
            const { ref, rerender } = renderWithRef(mocks);

            rerender(<PriceGraph ref={ref} {...mocks} alternativeOffers={[{} as any]} />);
            expect((ref.current as any)['prevAlternativeOffersLength']).toBe(18);
        });

        it('calls scroll when scrollDirection exists (mobile)', () => {
            mocks.isMobileView = true;
            const { ref, rerender } = renderWithRef(mocks);
            const scrollSpy = jest.spyOn(ref.current as any, 'scroll');

            (ref.current as any)['changeScrollDirection']('LEFT');
            rerender(<PriceGraph ref={ref} {...mocks} />);

            expect(scrollSpy).toHaveBeenCalled();
        });

        it('does nothing in the neutral update case', () => {
            const { ref, rerender } = renderWithRef(mocks);
            const scrollSpy = jest.spyOn(ref.current as any, 'scroll');
            const resetSpy = jest.spyOn(ref.current as any, 'resetToInitial');
            const loadGraphSpy = jest.spyOn(ref.current as any, 'loadGraphData');
            const loadDataSpy = jest.spyOn(ref.current as any, 'loadData');

            rerender(<PriceGraph ref={ref} {...mocks} isScreenLarge />);

            expect(loadDataSpy).not.toHaveBeenCalled();
            expect(loadGraphSpy).not.toHaveBeenCalled();
            expect(resetSpy).not.toHaveBeenCalled();
            expect(scrollSpy).not.toHaveBeenCalled();
            expect((ref.current as any)['prevAlternativeOffersLength']).toBe(18);
        });
    });

    describe('barWidth', () => {
        it('returns desktop width', () => {
            const { ref } = renderWithRef(mocks);
            expect((ref.current as any).barWidth).toBe(PriceGraphSettings.barWidth.desktop);
        });

        it('returns mobile width', () => {
            mocks.isMobileView = true;
            const { ref } = renderWithRef(mocks);
            expect((ref.current as any).barWidth).toBe(PriceGraphSettings.barWidth.mobile);
        });
    });

    describe('graphWidth', () => {
        it('should return desktop calc width', () => {
            const { ref } = renderWithRef(mocks);
            expect((ref.current as any).graphWidth).toBe('calc(100% - 32px - 32px)');
        });

        it('should return mobile px width', () => {
            mocks.isMobileView = true;
            const { ref } = renderWithRef(mocks);
            expect((ref.current as any).graphWidth).toBe('990px');
        });
    });
});
