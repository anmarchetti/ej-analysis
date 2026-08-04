import React from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { DataStatus } from 'models/enum/DataStatus';

import { useRenderMobileFilters } from './useRenderMobileFilters';

let mockStores;
jest.mock('frontend/hooks/useMediaQuery');

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, ...props }) => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={onClick}>
                {children}
            </button>
        );
    },
}));

const mockPopupNew = jest.fn();
jest.mock('frontend/components/common/Popup/PopupNew', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockPopupNew(props);

        return <div data-tid='popup'>{children()}</div>;
    },
}));

const mockMobileFiltersModal = jest.fn();
jest.mock('frontend/components/common/MobileFilterModal/MobileFilterModal', () => ({
    __esModule: true,
    default: ({ onClose, ...props }) => {
        mockMobileFiltersModal(props);

        return <button data-tid='mobile-filter-modal' onClick={onClose} onKeyDown={jest.fn()} />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useRenderMobileFilters', () => {
    beforeEach(() => {
        jest.mocked(useMobileViewport).mockReturnValue(true);
        mockStores = createMockStores({
            searchFiltersStore: {
                countableFilters: [],
                isFiltersLoaded: true,
                onChangeSearchFilterStore: jest.fn(),
                isModalDisplayed: true,
            },
            hotelsStore: {
                status: DataStatus.Loaded,
            },

            layoutStore: {
                getPhrase: jest.fn(),
                isPromoPage: false,
            },
        });
    });

    it('should render filter button for promo-page', () => {
        mockStores.layoutStore.isPromoPage = true;

        const { result } = renderHook(() => useRenderMobileFilters());

        render(result.current.renderFiltersButton());

        expect(mockButtonProps).toHaveBeenCalledWith({
            isText: false,
            isOutlined: true,
            id: 'filter-button',
            className: 'search-pod-filter__button',
            dataTid: 'filter-button',
        });
    });

    it('should render filter button correctly', () => {
        const { result } = renderHook(() => useRenderMobileFilters());
        render(result.current.renderFiltersButton({ className: 'className' }));

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('search-filter')).toHaveClass('search-filter className');
    });

    it('renders shimmer during loading', () => {
        mockStores.hotelsStore.status = DataStatus.Loading;
        mockStores.searchFiltersStore.isFiltersLoaded = false;
        const { result } = renderHook(() => useRenderMobileFilters());
        render(result.current.renderFiltersButton());

        expect(screen.getByTestId('shimmer')).toBeInTheDocument();
    });

    it('toggles isModalDisplayed when filter button is clicked and MobileFilterModal close is called', () => {
        const ctx = {};
        mockStores.searchFiltersStore.onChangeSearchFilterStore = jest.fn(({ cb }) => cb?.(ctx));

        const { result } = renderHook(() => useRenderMobileFilters());

        render(result.current.renderFiltersButton());

        fireEvent.click(screen.getByTestId('button'));

        render(result.current.renderFiltersPopup()!);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
            key: 'isModalDisplayed',
            value: true,
        });
        expect(mockPopupNew).toHaveBeenCalledWith({
            fullWidth: true,
            onClose: expect.any(Function),
        });

        expect(mockMobileFiltersModal).toHaveBeenCalledWith({});

        fireEvent.click(screen.getByTestId('mobile-filter-modal'));

        expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
            cb: expect.any(Function),
        });
        expect(ctx).toStrictEqual({ isModalDisplayed: false, selectedFilterGroups: new Set() });
    });

    it('renders active filter icon when there are countableFilters', () => {
        mockStores.searchFiltersStore.countableFilters = [{}];

        const { result } = renderHook(() => useRenderMobileFilters());
        render(result.current.renderFiltersButton());

        const activeIcon = screen.getByTestId('active-icon');
        expect(activeIcon).toBeInTheDocument();
    });

    it('should not render popup on desktop', () => {
        jest.mocked(useMobileViewport).mockReturnValue(false);
        const { result } = renderHook(() => useRenderMobileFilters());

        render(result.current.renderFiltersButton());
        act(() => {
            fireEvent.click(screen.getByTestId('button'));
        });
        render(result.current.renderFiltersPopup()!);

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
        expect(screen.queryByTestId('mobile-filter-modal')).not.toBeInTheDocument();
    });

    it('should not render popup when isModalDisplayed is false', () => {
        mockStores.searchFiltersStore.isModalDisplayed = false;
        const { result } = renderHook(() => useRenderMobileFilters());

        render(result.current.renderFiltersButton());
        act(() => {
            fireEvent.click(screen.getByTestId('button'));
        });
        render(result.current.renderFiltersPopup()!);

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
        expect(screen.queryByTestId('mobile-filter-modal')).not.toBeInTheDocument();
    });
});
