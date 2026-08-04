import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SliderNavButton from './SliderNavButton';

jest.mock('frontend/components/icons-new/ChevronLeft', () => () => <div data-tid='chevron-left-icon' />);
jest.mock('frontend/components/icons-new/ChevronRight', () => () => <div data-tid='chevron-right-icon' />);

const resetMocks = () => ({
    onClick: jest.fn(),
});

let mocks;

describe('<SliderNavButton />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render button with chevron right when isLeftNav is false', () => {
        render(<SliderNavButton {...mocks} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    });

    it('should render button with chevron left when isLeftNav is true', () => {
        mocks.isLeftNav = true;

        render(<SliderNavButton {...mocks} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
    });

    it('Should call onClick on button click', async () => {
        render(<SliderNavButton {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mocks.onClick).toHaveBeenCalled();
    });

    it('Should call onFocus & onBlur handlers from props', async () => {
        mocks.onFocus = jest.fn();
        mocks.onBlur = jest.fn();

        render(<SliderNavButton {...mocks} />);

        await userEvent.tab();

        expect(mocks.onFocus).toHaveBeenCalled();

        await userEvent.tab();

        expect(mocks.onBlur).toHaveBeenCalled();
    });
});
