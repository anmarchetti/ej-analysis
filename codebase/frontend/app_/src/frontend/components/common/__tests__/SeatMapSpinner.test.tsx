import { render } from '@testing-library/react';

import SeatMapSpinner from 'frontend/components/common/SeatMapSpinner';

describe('<SeatMapSpinner  />', () => {
    it(`Should render`, () => {
        const { getByTestId } = render(<SeatMapSpinner />);
        expect(getByTestId('seat-map-spinner')).toBeInTheDocument();
    });
});
