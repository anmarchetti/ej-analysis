import React from 'react';
import { render } from '@testing-library/react';

import HotelInfoBrowse from './HotelInfoBrowse';

const createProps = () => ({
    fields: {},
    rendering: {},
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/renderings/HotelDetails/HotelInfo/components/HotelInfo', () => () => (
    <div data-tid='hotel-info' />
));

describe('<HotelInfoBrowse />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render HotelInfo', () => {
        const { getByTestId } = render(<HotelInfoBrowse {...mockProps} />);

        expect(getByTestId('hotel-info')).toBeInTheDocument();
    });
});
