import React from 'react';
import { render, screen } from '@testing-library/react';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FacilitiesTabPanel from './FacilitiesTabPanel';

const createProps = () => ({
    isActive: false,
    facilityGroup: {
        id: '1',
        code: 'TEST',
        name: 'name',
        iconUrl: 'icon',
        items: [
            { code: 'code1', name: 'name1' },
            { code: 'code2', name: 'name2' },
            { code: 'code3', name: 'name3' },
        ],
        title: 'title',
        description: 'description',
        image: { small: 'small', medium: 'medium', large: 'large' },
    },
    rendering: {
        placeholders: { [PlaceholderNames.EcoCertified]: ['test'] },
    },
    isShowEcoFacilityPlaceholder: false,
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    routerStore: {},
    appStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: () => <div data-tid='placeholder' />,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FacilitiesTabs/FacilityGroupItems',
    () => () => <div data-tid='facility-group-items' />,
);

jest.mock('frontend/components/common/HotelImage/HotelImage', () => () => <div data-tid='hotel-image' />);

describe('<FacilitiesTabPanel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render d-none class when is NOT Active', () => {
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.getByRole('tabpanel')).toHaveClass('d-none');
    });

    it('should NOT render d-none class when is Active', () => {
        mockProps.isActive = true;
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.getByRole('tabpanel')).not.toHaveClass('d-none');
    });

    it('should render facility group title', () => {
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent('title');
    });

    it('should render facility group name when no facility group title provided', () => {
        mockProps.facilityGroup.title = null;
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent('name');
    });

    it('should render facility group description', () => {
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.getByText('description')).toBeInTheDocument();
    });

    it('should NOT render facility group description when description NOT provided', () => {
        mockProps.facilityGroup.description = null;
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.queryByText('description')).not.toBeInTheDocument();
    });

    it('should render placeholder when code is OV and isShowEcoFacilityPlaceholder is true', () => {
        mockProps.facilityGroup.code = 'OV';
        mockProps.isShowEcoFacilityPlaceholder = true;

        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
    });

    it('should NOT render placeholder when no rendering', () => {
        mockProps.isShowEcoFacilityPlaceholder = true;
        mockProps.rendering = null;
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.queryByTestId('heading')).not.toBeInTheDocument();
    });

    it('should NOT render placeholder when is NOT ShowEcoFacilityPlaceholder', () => {
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.queryByTestId('heading')).not.toBeInTheDocument();
    });

    it('should NOT render placeholder when facilityGroup code is NOT equal OV', () => {
        mockProps.facilityGroup.code = 'test';
        mockProps.isShowEcoFacilityPlaceholder = true;
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.queryByTestId('heading')).not.toBeInTheDocument();
    });

    it('should render FacilityGroupItems', () => {
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.getByTestId('facility-group-items')).toBeInTheDocument();
    });

    it('should NOT render FacilityGroupItems when code is equal FD and description is provided', () => {
        mockProps.facilityGroup.code = 'FD';
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.queryByTestId('facility-group-items')).not.toBeInTheDocument();
    });

    it('should render HotelImage', () => {
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.getByTestId('hotel-image')).toBeInTheDocument();
    });

    it('should render HotelInfoLabelsFacilitiesDisclaimer', () => {
        render(<FacilitiesTabPanel {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.HotelInfoLabelsFacilitiesDisclaimer)).toBeInTheDocument();
    });
});
