import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataStatus } from 'models/enum/DataStatus';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import {
    IOffersSortProps,
    OffersSort,
} from 'frontend/components/renderings/SearchResults/components/OffersSort/OffersSort';
import { sortConfig } from 'frontend/components/renderings/SearchResults/sort.config';

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: () => <div />,
    TooltipContent: () => <div />,
}));

const mockSelectProps = jest.fn();
jest.mock('react-select', () => ({
    __esModule: true,
    default: (props: any) => {
        mockSelectProps(props);

        return <div data-tid='react-select' />;
    },
}));

const mockDrawerProps = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OffersSortDrawer', () => ({
    __esModule: true,
    default: (props: any) => {
        mockDrawerProps(props);

        return <div data-tid='offers-sort-drawer' />;
    },
}));

const lastSelectProps = () => mockSelectProps.mock.calls[mockSelectProps.mock.calls.length - 1]?.[0];

describe('<OffersSort />', () => {
    const resetMocks = (): IOffersSortProps => ({
        orderBy: OrderBy.Recommended,
        orderDirection: OrderDirection.Default,
        sortConfig: [
            {
                title: 'Rec',
                code: 'RMD',
                orderBy: OrderBy.Recommended,
                orderDirection: OrderDirection.Default,
            },
            {
                title: 'Price Low',
                code: 'PLTH',
                orderBy: OrderBy.Price,
                orderDirection: OrderDirection.Asc,
            },
            {
                title: 'Price High',
                code: 'PHTL',
                orderBy: OrderBy.Price,
                orderDirection: OrderDirection.Desc,
            },
            {
                title: 'Discount Pounds',
                code: 'DAPOUNDS',
                orderBy: OrderBy.DiscAmount,
                orderDirection: OrderDirection.Desc,
            },
            {
                title: 'Discount %',
                code: 'DAPERCENTS',
                orderBy: OrderBy.DiscPercent,
                orderDirection: OrderDirection.Desc,
            },
            {
                title: 'Trip Advisor',
                code: 'TA',
                orderBy: OrderBy.TripAdvisor,
                orderDirection: OrderDirection.Desc,
            },
        ],
        getPhrase: jest.fn(p => p),
        onSelectOrder: jest.fn(),
        fetchOffers: jest.fn(),
        buildSearchQuery: jest.fn(),
        setPageNumber: jest.fn(),
        updateSearchResultsPage: jest.fn(),
        updateDataLayer: jest.fn(),
        isPromoPage: false,
        isScreenLessMedium: false,
        status: DataStatus.Loaded,
        isFiltersLoaded: true,
        hasDiscont: false,
        layoutId: 'String',
        isDynamicPromoPage: false,
        updateSearchParamsAndExecuteSearch: jest.fn().mockResolvedValue(undefined),
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('Base render', () => {
        it('should render select with tooltip', () => {
            const { container } = render(<OffersSort {...mocks} />);

            expect(container.querySelector('.hotel-sort')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip')).toBeInTheDocument();
            expect(screen.getByTestId('react-select')).toBeInTheDocument();
        });

        it('should not render tooltip if no dictionary', () => {
            mocks.getPhrase = jest.fn().mockReturnValue(null);

            render(<OffersSort {...mocks} />);

            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        });

        it('should render 4 options if no discount', () => {
            render(<OffersSort {...mocks} />);

            const sp = lastSelectProps();

            expect(sp.options).toHaveLength(4);
        });

        it('should render 6 options if there is discount', () => {
            mocks.hasDiscont = true;

            render(<OffersSort {...mocks} />);

            const sp = lastSelectProps();

            expect(sp.options).toHaveLength(6);
        });

        it('should call updateSearchParamsAndExecuteSearch(false) and updateDataLayer when isDynamicPromoPage is true', async () => {
            mocks.isDynamicPromoPage = true;

            render(<OffersSort {...mocks} />);

            const sp = lastSelectProps();
            await sp.onChange({ value: 'PLTH' });

            expect(mocks.setPageNumber).toHaveBeenCalledTimes(1);
            expect(mocks.onSelectOrder).toHaveBeenCalled();
            expect(mocks.updateSearchParamsAndExecuteSearch).toHaveBeenCalledWith(false);
            expect(mocks.updateDataLayer).toHaveBeenCalledTimes(1);
            expect(mocks.fetchOffers).not.toHaveBeenCalled();
        });

        it('should show loading skeleton', () => {
            mocks.isFiltersLoaded = false;
            mocks.status = DataStatus.Loading;

            const { container } = render(<OffersSort {...mocks} />);

            expect(container.querySelector('.placeholder-shimmer')).toBeInTheDocument();
        });

        it('should update selected option when props change', () => {
            const { rerender } = render(<OffersSort {...mocks} />);

            const newProps = { ...mocks, orderBy: 'price' as any };

            rerender(<OffersSort {...newProps} />);

            const sp = lastSelectProps();
            expect(sp.value?.value || sp.defaultValue?.value).toBeDefined();
        });
    });

    describe('OffersSort select onChange action', () => {
        it('should NOT call onChange IF selectedOrder === select value', () => {
            render(<OffersSort {...mocks} />);
            const sp = lastSelectProps();

            sp.onChange({ value: 'RMD' });

            expect(mocks.setPageNumber).toHaveBeenCalledTimes(0);
            expect(mocks.onSelectOrder).not.toHaveBeenCalled();
        });

        it('should call onChange', () => {
            render(<OffersSort {...mocks} />);

            const sp = lastSelectProps();
            sp.onChange({ value: 'PLTH' });

            expect(mocks.setPageNumber).toHaveBeenCalledTimes(1);
            expect(mocks.onSelectOrder).toHaveBeenCalled();
        });

        it('should open drawer on mobile', async () => {
            mocks.isScreenLessMedium = true;
            mockDrawerProps.mockClear();

            render(<OffersSort {...mocks} />);

            const btn = screen.getByRole('button', { name: /SearchResults\.Labels\.SortBy/i });

            const user = userEvent.setup();
            await user.click(btn);

            await waitFor(() => {
                const last = mockDrawerProps.mock.calls.at(-1)?.[0];
                expect(last?.isOpen).toBe(true);
            });
        });
    });

    describe('OffersSort actual value', () => {
        it('should be changed to request value', () => {
            mocks.orderBy = null;
            mocks.orderDirection = null;

            const { rerender } = render(<OffersSort {...mocks} />);

            const next = {
                ...mocks,
                orderBy: mocks.sortConfig[1].orderBy,
                orderDirection: mocks.sortConfig[1].orderDirection,
            };

            rerender(<OffersSort {...next} />);

            const sp = lastSelectProps();

            expect((sp.value ?? sp.defaultValue)?.value).toBe(mocks.sortConfig[1].code);
        });

        it('should be changed to default value', () => {
            mocks.orderBy = OrderBy.Price;
            mocks.orderDirection = OrderDirection.Asc;

            const { rerender } = render(<OffersSort {...mocks} />);

            const next = { ...mocks, orderBy: '' as any, orderDirection: '' as any };

            rerender(<OffersSort {...next} />);

            const sp = lastSelectProps();

            expect((sp.value ?? sp.defaultValue)?.value).toBe(mocks.sortConfig[0].code);
        });

        it('should be changed to default value after open other Promo Page', () => {
            mocks.orderBy = OrderBy.Price;
            mocks.orderDirection = OrderDirection.Asc;
            mocks.isPromoPage = true;

            const { rerender } = render(<OffersSort {...mocks} />);

            const next = { ...mocks, layoutId: 'test' };

            rerender(<OffersSort {...next} />);

            const sp = lastSelectProps();

            expect((sp.value ?? sp.defaultValue)?.value).toBe(mocks.sortConfig[0].code);
        });

        it('should keep request value after response without discount', () => {
            mocks.orderBy = sortConfig[1].orderBy;
            mocks.orderDirection = sortConfig[1].orderDirection;
            mocks.hasDiscont = true;

            const { rerender } = render(<OffersSort {...mocks} />);

            const next = { ...mocks, hasDiscont: false };

            rerender(<OffersSort {...next} />);

            const sp = lastSelectProps();

            expect((sp.value ?? sp.defaultValue)?.value).toBe(mocks.sortConfig[1].code);
        });
    });
});
