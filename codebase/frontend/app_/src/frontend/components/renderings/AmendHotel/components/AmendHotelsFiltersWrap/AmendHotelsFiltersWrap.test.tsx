import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendHotelsFiltersWrap from './AmendHotelsFiltersWrap';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));
jest.mock('frontend/hooks/useMediaQuery');
jest.mock('frontend/components/renderings/AmendHotel/components/AmendHotelFilters/AmendHotelFilters', () => ({
    __esModule: true,
    default: () => <div data-tid='amend-hotel-filter' />,
}));

const mockDrawerProps = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: props => {
        mockDrawerProps(props);

        return <div data-tid='drawer'>{props.children}</div>;
    },
}));

let mockStores;
const mockUseMobileViewport = jest.mocked(useMobileViewport);

describe('AmendHotelsFiltersWrap', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendHotelStore: {
                filters: {
                    toggleFilterMobileDrawer: jest.fn(),
                    isMobileDrawerOpen: false,
                },
            },
        });
        mockUseMobileViewport.mockReturnValue(false);
    });

    it('should render AmendHotelFilters component', () => {
        render(<AmendHotelsFiltersWrap />);
        expect(screen.getByTestId('amend-hotel-filter')).toBeInTheDocument();
    });

    it('should render Drawer component when isMobile is true', () => {
        mockUseMobileViewport.mockReturnValue(true);
        mockStores.amendHotelStore.filters.isMobileDrawerOpen = true;

        render(<AmendHotelsFiltersWrap />);

        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsCancel)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsApply)).toBeInTheDocument();
        expect(mockDrawerProps).toHaveBeenCalledWith({
            open: true,
            isBodyScrollLocked: true,
            children: expect.anything(),
        });
    });

    it('should call toggleFilterMobileDrawer when cancel button is clicked', () => {
        mockUseMobileViewport.mockReturnValue(true);

        render(<AmendHotelsFiltersWrap />);

        fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsCancel));
        expect(mockStores.amendHotelStore.filters.toggleFilterMobileDrawer).toHaveBeenCalled();
    });

    it('should call toggleFilterMobileDrawer when apply button is clicked', () => {
        mockUseMobileViewport.mockReturnValue(true);

        render(<AmendHotelsFiltersWrap />);

        fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsApply));
        expect(mockStores.amendHotelStore.filters.toggleFilterMobileDrawer).toHaveBeenCalled();
    });
});
