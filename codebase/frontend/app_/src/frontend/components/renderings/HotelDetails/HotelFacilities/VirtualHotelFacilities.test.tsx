import React from 'react';
import { render } from '@testing-library/react';

import VirtualHotelFacilities from './VirtualHotelFacilities';

const createProps = () => ({
    fields: { title: 'title' },
    rendering: {},
    isShowEcoFacilityPlaceholder: false,
});

const createStores = () => ({
    layoutStore: { isEditMode: false },
    trackingStore: { trackHotelBrowseEcommerce: jest.fn() },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/HotelDetails/HotelFacilities/components/Facilities', () => () => (
    <div data-tid='facilities' />
));

jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FacilitiesEditMode/FacilitiesEditMode',
    () => () => <div data-tid='facilities-edit-mode' />,
);

describe('<VirtualHotelFacilities />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if isEdit mode and no fields', () => {
        mockStores.layoutStore.isEditMode = true;
        mockProps.fields = null;
        const { container } = render(<VirtualHotelFacilities {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render FacilitiesEditMode if isEdit mode and fields are provided', () => {
        mockStores.layoutStore.isEditMode = true;
        const { getByTestId } = render(<VirtualHotelFacilities {...mockProps} />);

        expect(getByTestId('facilities-edit-mode')).toBeInTheDocument();
    });

    it('should render Facilities if is NOT Edit mode', () => {
        const { getByTestId } = render(<VirtualHotelFacilities {...mockProps} />);

        expect(getByTestId('facilities')).toBeInTheDocument();
    });
});
