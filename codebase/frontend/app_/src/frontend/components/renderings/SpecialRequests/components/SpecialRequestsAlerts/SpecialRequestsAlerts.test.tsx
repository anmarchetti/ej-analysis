import React from 'react';
import { render } from '@testing-library/react';

import SpecialRequestsAlerts from './SpecialRequestsAlerts';

const createProps = () => ({
    alerts: [{ message: 'message', description: 'description' }],
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/common/ErrorMessage', () => () => <div data-tid='error-message' />);

describe('<SpecialRequestsAlerts />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render if alerts NOT provided', () => {
        mockProps.alerts = [];
        const { container } = render(<SpecialRequestsAlerts {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render ErrorMessage when 1 alert is provided', () => {
        const { getByTestId } = render(<SpecialRequestsAlerts {...mockProps} />);

        expect(getByTestId('error-message')).toBeInTheDocument();
    });
});
