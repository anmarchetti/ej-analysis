import React from 'react';
import { render, screen } from '@testing-library/react';

import LoadingState from './LoadingState';

describe('<LoadingState />', () => {
    it('should render component', () => {
        render(<LoadingState />);

        expect(screen.getByTestId('assisted-travel-form-loading-state')).toBeInTheDocument();
    });
});
