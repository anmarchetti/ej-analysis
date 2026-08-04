import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import Facilities from './Facilities';

const createProps = () => ({
    facilityGroups: [],
    rendering: {},
    isShowEcoFacilityPlaceholder: false,
    shouldShowTitle: true,
    titleDictionaryKey: SitecoreDictionary.BookingSummaryTitlesFacilitiesTitle,
    isPrintPreview: false,
});

const createStores = () => ({
    layoutStore: {
        isHotelFacilitiesTabsDesignEnabled: false,
        filterFacilitiesByDesignVariant: jest.fn(() => [1, 2, 3]),
        isPostBookingPages: false,
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFacilitiesTabs = jest.fn();
jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FacilitiesTabs/FacilitiesTabs',
    () => props => {
        mockFacilitiesTabs(props);

        return <div data-tid='facilities-tabs' />;
    },
);

const mockFacilitiesLists = jest.fn();

jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FacilitiesLists/FacilitiesLists',
    () => props => {
        mockFacilitiesLists(props);

        return <div data-tid='facilities-lists' />;
    },
);

describe('<Facilities />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no filtered groups', () => {
        mockStores.layoutStore.filterFacilitiesByDesignVariant = jest.fn(() => []);
        const { container } = render(<Facilities {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render FacilitiesTabs when isHotelFacilitiesTabsDesignEnabled', () => {
        mockStores.layoutStore.isHotelFacilitiesTabsDesignEnabled = true;
        const { getByTestId } = render(<Facilities {...mockProps} />);
        expect(mockFacilitiesTabs).toHaveBeenCalledWith({
            facilityGroups: [1, 2, 3],
            isShowEcoFacilityPlaceholder: mockProps.isShowEcoFacilityPlaceholder,
            rendering: {},
            shouldShowTitle: mockProps.shouldShowTitle,
            titleDictionaryKey: mockProps.titleDictionaryKey,
            hideOnPrint: mockStores.layoutStore.isPostBookingPages,
        });

        expect(getByTestId('facilities-tabs')).toBeInTheDocument();
    });

    it('should render FacilitiesLists when isPrintPreview', () => {
        mockProps.isPrintPreview = true;
        mockStores.layoutStore.isHotelFacilitiesTabsDesignEnabled = true;
        render(<Facilities {...mockProps} />);
        expect(mockFacilitiesLists).toHaveBeenCalledWith({
            facilityGroups: [1, 2, 3],
            rendering: {},
        });

        expect(screen.queryByTestId('facilities-tabs')).not.toBeInTheDocument();
    });

    it('should render FacilitiesLists when is NOT HotelFacilitiesTabsDesignEnabled', () => {
        const { getByTestId } = render(<Facilities {...mockProps} />);
        expect(mockFacilitiesLists).toHaveBeenCalledWith({
            facilityGroups: [1, 2, 3],
            rendering: {},
        });

        expect(getByTestId('facilities-lists')).toBeInTheDocument();
    });

    it('should render both Facilities on PostBookingPages when isHotelFacilitiesTabsDesignEnabled', () => {
        mockStores.layoutStore.isHotelFacilitiesTabsDesignEnabled = true;
        mockStores.layoutStore.isPostBookingPages = true;
        render(<Facilities {...mockProps} />);

        expect(mockFacilitiesTabs).toHaveBeenCalledWith({
            facilityGroups: [1, 2, 3],
            isShowEcoFacilityPlaceholder: mockProps.isShowEcoFacilityPlaceholder,
            rendering: {},
            shouldShowTitle: mockProps.shouldShowTitle,
            titleDictionaryKey: mockProps.titleDictionaryKey,
            hideOnPrint: mockStores.layoutStore.isPostBookingPages,
        });
        expect(mockFacilitiesLists).toHaveBeenCalledWith({
            facilityGroups: [1, 2, 3],
            rendering: {},
            showOnPrintOnly: true,
        });
        expect(screen.getByTestId('facilities-lists')).toBeInTheDocument();
        expect(screen.getByTestId('facilities-tabs')).toBeInTheDocument();
    });
});
