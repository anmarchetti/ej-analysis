import React from 'react';
import { render } from '@testing-library/react';

import settings from 'code/settings';

import FacilitiesListGroup from './FacilitiesListGroup';

const createProps = () => ({
    title: 'title',
    iconUrl: 'icon',
    facilities: [
        { code: 'code1', name: 'name1' },
        { code: 'code2', name: 'name2' },
        { code: 'code3', name: 'name3' },
    ],
    showOnlyFirstN: false,
});

settings.HotelDetails.MaxFacilityNumberBeforeBreakdown = 0;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<FacilitiesListGroup />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render when no facilities provided', () => {
        mockProps.facilities = [];
        const { container } = render(<FacilitiesListGroup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render facility-group when facilities provided', () => {
        const { getByTestId } = render(<FacilitiesListGroup {...mockProps} />);

        expect(getByTestId('facility-group')).toBeInTheDocument();
    });

    it('should NOT render title and image when title not provided', () => {
        mockProps.title = null;
        const { queryByRole } = render(<FacilitiesListGroup {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
        expect(queryByRole('presentation')).not.toBeInTheDocument();
    });

    it('should render title and image when title and image provided', () => {
        const { getByRole } = render(<FacilitiesListGroup {...mockProps} />);

        expect(getByRole('heading')).toBeInTheDocument();
        expect(getByRole('presentation')).toBeInTheDocument();
    });

    it('should render title without image when only title provided', () => {
        mockProps.iconUrl = null;
        const { getByRole, queryByRole } = render(<FacilitiesListGroup {...mockProps} />);

        expect(getByRole('heading')).toBeInTheDocument();
        expect(queryByRole('presentation')).not.toBeInTheDocument();
    });

    it('should render list with 3 list items', () => {
        const { getByRole, getAllByRole } = render(<FacilitiesListGroup {...mockProps} />);

        expect(getByRole('list')).toBeInTheDocument();
        expect(getAllByRole('listitem').length).toBe(3);
    });

    it('should render 2 d-none className when showOnlyFirstN and there is 2 more facilities than MaxFacilityNumberBeforeBreakdown settings', () => {
        mockProps.showOnlyFirstN = true;
        const { container } = render(<FacilitiesListGroup {...mockProps} />);

        expect(container.getElementsByClassName('d-none').length).toBe(2);
    });

    it('should NOT render d-none classNames when NOT showOnlyFirstN', () => {
        const { container } = render(<FacilitiesListGroup {...mockProps} />);

        expect(container.getElementsByClassName('d-none').length).toBe(0);
    });

    it('should NOT render d-none classNames when showOnlyFirstN and less facilities than MaxFacilityNumberBeforeBreakdown settings', () => {
        settings.HotelDetails.MaxFacilityNumberBeforeBreakdown = 10;
        mockProps.showOnlyFirstN = true;
        const { container } = render(<FacilitiesListGroup {...mockProps} />);

        expect(container.getElementsByClassName('d-none').length).toBe(0);
    });

    it('should render facilities names', () => {
        const { getByText } = render(<FacilitiesListGroup {...mockProps} />);

        expect(getByText('name1')).toBeInTheDocument();
        expect(getByText('name2')).toBeInTheDocument();
        expect(getByText('name3')).toBeInTheDocument();
    });
});
