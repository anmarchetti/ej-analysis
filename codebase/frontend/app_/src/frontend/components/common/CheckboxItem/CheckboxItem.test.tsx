import React from 'react';
import { render } from '@testing-library/react';

import CheckboxItem from './CheckboxItem';

const createProps = () => ({
    icon: false,
    hotelIcon: false,
    disabled: false,
    enableIfChecked: false,
    disabledShowUnchecked: false,

    code: 'code',
    name: 'name',
    checked: false,
    dataType: 'data',

    onChange: jest.fn(),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/icons/MapMarker', () => () => <div data-tid='map-marker' />);

jest.mock('frontend/components/icons/Bed', () => () => <div data-tid='bed' />);

describe('<CheckboxItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render checkbox item', () => {
        const { getByTestId } = render(<CheckboxItem {...mockProps} />);

        expect(getByTestId('code')).toBeInTheDocument();
    });

    it('should render checkbox', () => {
        const { getByRole } = render(<CheckboxItem {...mockProps} />);

        expect(getByRole('checkbox')).toBeInTheDocument();
    });

    it('should NOT render IconMapMarker', () => {
        const { queryByTestId } = render(<CheckboxItem {...mockProps} />);

        expect(queryByTestId('map-marker')).not.toBeInTheDocument();
    });

    it('should render IconMapMarker', () => {
        mockProps.icon = true;
        const { getByTestId } = render(<CheckboxItem {...mockProps} />);

        expect(getByTestId('map-marker')).toBeInTheDocument();
    });

    it('should NOT render IconBed', () => {
        const { queryByTestId } = render(<CheckboxItem {...mockProps} />);

        expect(queryByTestId('bed')).not.toBeInTheDocument();
    });

    it('should render IconBed', () => {
        mockProps.hotelIcon = true;
        const { getByTestId } = render(<CheckboxItem {...mockProps} />);

        expect(getByTestId('bed')).toBeInTheDocument();
    });

    it('should render name', () => {
        const { getByText } = render(<CheckboxItem {...mockProps} />);

        expect(getByText('name')).toBeInTheDocument();
    });
});
