import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ComparePriceButton, { IComparePriceButtonProps } from './ComparePriceButton';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/CalendarLined.tsx', () => ({
    __esModule: true,
    default: () => <i data-tid='calendar-lined' />,
}));

let props: IComparePriceButtonProps;
const mockStores = createMockStores();

describe('<ComparePriceButton />', () => {
    beforeEach(() => {
        props = {
            onClick: jest.fn(),
        };
    });

    it('should standard render', async () => {
        render(<ComparePriceButton {...props} />);

        const button = screen.getByRole('button');

        await userEvent.click(button);

        expect(props.onClick).toHaveBeenCalled();
        expect(screen.getByTestId('calendar-lined')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.PriceGraphButtonsViewComparePrices)).toBeInTheDocument();
    });
});
