import React from 'react';
import { render } from '@testing-library/react';

import FacilitiesTabsPanels from './FacilitiesTabsPanels';

const createProps = () => ({
    facilityGroups: [
        { name: 'group1', iconUrl: 'url1', id: '1' },
        { name: 'group2', iconUrl: 'url2', id: '2' },
        { name: 'group3', iconUrl: 'url3', id: '3' },
    ],
    activeTabIndex: 1,
    rendering: {},
    isShowEcoFacilityPlaceholder: false,
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FacilitiesTabs/FacilitiesTabPanel',
    () => () => <div data-tid='facilities-tab-panel' />,
);

describe('<FacilitiesTabsPanels />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render 3 FacilitiesTabPanels', () => {
        const { getAllByTestId } = render(<FacilitiesTabsPanels {...mockProps} />);

        expect(getAllByTestId('facilities-tab-panel').length).toBe(3);
    });

    it('should NOT render FacilitiesTabPanels when facilityGroups NOT provided', () => {
        mockProps.facilityGroups = [];
        const { queryByTestId } = render(<FacilitiesTabsPanels {...mockProps} />);

        expect(queryByTestId('facilities-tab-panel')).not.toBeInTheDocument();
    });
});
