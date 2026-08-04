import React from 'react';
import { render, screen } from '@testing-library/react';

import { TryCatch } from './TryCatch';

const resetMocks = () => ({
    redirectHome: false,
    silent: false,
    children: [<div data-tid='test-children' key='test' />],
});

let mocks;

describe('<TryCatch />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        render(<TryCatch {...mocks} />);

        expect(screen.getByTestId('test-children')).toBeInTheDocument();
    });
});
