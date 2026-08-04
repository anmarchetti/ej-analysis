import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import { FilterTile, IFilterTileProps } from './FilterTile';

jest.mock('frontend/components/icons-new/ChevronDown', () => () => <svg data-tid='svg-chevron-down' />);
jest.mock('frontend/components/icons-new/ChevronUp', () => () => <svg data-tid='svg-chevron-up' />);

describe('FilterTile', () => {
    const resetMocks = () =>
        ({
            title: 'title',
            code: FilterGroupCodes.Destination,
            onClick: jest.fn(),
            isActive: false,
            isDisabled: false,
        } as IFilterTileProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render', () => {
        render(<FilterTile {...mocks} />);

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();

        expect(button).toHaveClass('btn');
        expect(button).toHaveClass('filters--button');
        expect(button).not.toHaveClass('active');

        expect(screen.getByTestId('svg-chevron-down')).toBeInTheDocument();
        expect(screen.queryByTestId('svg-chevron-up')).not.toBeInTheDocument();
    });

    it('should render active', () => {
        mocks.isActive = true;
        render(<FilterTile {...mocks} />);

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('active');

        expect(screen.getByTestId('svg-chevron-up')).toBeInTheDocument();
        expect(screen.queryByTestId('svg-chevron-down')).not.toBeInTheDocument();
    });

    it('should call onClick when button is clicked', async () => {
        render(<FilterTile {...mocks} />);

        const button = screen.getByRole('button');
        await userEvent.click(button);

        expect(mocks.onClick).toHaveBeenCalledWith(mocks.code);
    });
});
