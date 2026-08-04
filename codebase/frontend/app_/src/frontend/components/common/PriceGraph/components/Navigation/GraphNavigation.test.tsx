import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import GraphNavigation from './GraphNavigation';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        layoutStore: { getPhrase: jest.fn(p => p) },
    }),
}));

describe('<GraphNavigation />', () => {
    const resetMocks = () => ({
        showPrevDates: jest.fn(),
        showNextDates: jest.fn(),
        isNextDisabled: false,
        isPrevDisabled: false,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render buttons', () => {
        render(<GraphNavigation {...mocks} />);

        const next = screen.getByRole('button', { name: SitecoreDictionary.PriceGraphButtonsNextDates });
        const prev = screen.getByRole('button', { name: SitecoreDictionary.PriceGraphButtonsPreviousDates });

        expect(next).toBeInTheDocument();
        expect(next).toBeEnabled();

        expect(prev).toBeInTheDocument();
        expect(prev).toBeEnabled();
    });

    it('should render next button disabled', () => {
        mocks.isNextDisabled = true;
        render(<GraphNavigation {...mocks} />);

        const next = screen.getByRole('button', { name: SitecoreDictionary.PriceGraphButtonsNextDates });

        expect(next).toBeDisabled();
    });

    it('should render prev button disabled', () => {
        mocks.isPrevDisabled = true;
        render(<GraphNavigation {...mocks} />);

        const prev = screen.getByRole('button', { name: SitecoreDictionary.PriceGraphButtonsPreviousDates });

        expect(prev).toBeDisabled();
    });

    it('should call showPrevDates on prev button click', async () => {
        render(<GraphNavigation {...mocks} />);

        const prev = screen.getByRole('button', { name: SitecoreDictionary.PriceGraphButtonsPreviousDates });

        await userEvent.click(prev);

        expect(mocks.showPrevDates).toHaveBeenCalled();
    });

    it('should call showNextDates on next button click', async () => {
        render(<GraphNavigation {...mocks} />);

        const next = screen.getByRole('button', { name: SitecoreDictionary.PriceGraphButtonsNextDates });

        await userEvent.click(next);

        expect(mocks.showNextDates).toHaveBeenCalled();
    });
});
