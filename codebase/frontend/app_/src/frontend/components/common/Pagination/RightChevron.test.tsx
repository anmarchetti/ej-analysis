import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RightChevron from './RightChevron';

describe('<RightChevron />', () => {
    const resetMocks = () => ({
        onClick: jest.fn(),
        ariaLabel: 'test',
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render button', () => {
        render(<RightChevron {...mocks} />);

        expect(screen.getByRole('button')).toHaveAttribute('aria-label', mocks.ariaLabel);
    });

    it('should call onClick on button click', async () => {
        render(<RightChevron {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mocks.onClick).toHaveBeenCalled();
    });
});
