import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import BackToReferrer, { IBackToReferrerProps } from './BackToReferrer';

let mockStores;
const mockProps: IBackToReferrerProps = {
    returnPath: '/en/buy/flights',
};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('BackToReferrer', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {},
            trackingStore: {
                trackBackToFlightsClick: jest.fn(),
            },
        });
    });

    it('Should not render the button if there is no referrer', () => {
        mockStores.layoutStore.referrer = undefined;

        render(<BackToReferrer {...mockProps} />);

        const button = screen.queryByTestId('go-back-to-flights');

        expect(button).not.toBeInTheDocument();
    });

    it('Should not render the button if the referrer is empty', () => {
        mockStores.layoutStore.referrer = '';

        render(<BackToReferrer {...mockProps} />);

        const button = screen.queryByTestId('go-back-to-flights');

        expect(button).not.toBeInTheDocument();
    });

    it('Should not render the button if returnPath is empty', () => {
        mockStores.layoutStore.referrer = 'https://easyjet.com';

        render(<BackToReferrer returnPath='' />);

        const button = screen.queryByTestId('go-back-to-flights');

        expect(button).not.toBeInTheDocument();
    });

    it('Should not render the button if the referrer is not well-formed', () => {
        mockStores.layoutStore.referrer = 'httpseasyjet.com';

        render(<BackToReferrer {...mockProps} />);

        const button = screen.queryByTestId('go-back-to-flights');

        expect(button).not.toBeInTheDocument();
    });

    it('Should render the button with the right url if the returnPath is not absolute', () => {
        mockStores.layoutStore.referrer = 'https://easyjet.com';

        render(<BackToReferrer {...mockProps} />);

        const button = screen.queryByTestId('go-back-to-flights');

        expect(button).toBeInTheDocument();
        expect(button?.getAttribute('href')).toBe('https://easyjet.com/en/buy/flights');
    });

    it('Should render the button with the right url if the referrer has a path', () => {
        mockStores.layoutStore.referrer = 'https://easyjet.com/this/should/not/be/used';

        render(<BackToReferrer {...mockProps} />);

        const button = screen.queryByTestId('go-back-to-flights');

        expect(button).toBeInTheDocument();
        expect(button?.getAttribute('href')).toBe('https://easyjet.com/en/buy/flights');
    });

    it('Should render the button with the right url (trailing / in referrer)', () => {
        mockStores.layoutStore.referrer = 'https://easyjet.com/';

        render(<BackToReferrer {...mockProps} />);

        const button = screen.queryByTestId('go-back-to-flights');

        expect(button).toBeInTheDocument();
        expect(button?.getAttribute('href')).toBe('https://easyjet.com/en/buy/flights');
    });

    it('Should render the button with the right url', () => {
        mockStores.layoutStore.referrer = 'https://easyjet.com';

        render(<BackToReferrer {...mockProps} />);

        const button = screen.queryByTestId('go-back-to-flights');

        expect(button).toBeInTheDocument();
        expect(button?.getAttribute('href')).toBe('https://easyjet.com/en/buy/flights');
    });

    it('Should call trackBackToFlightsClick with the correct params when clicking on Back to flights button', async () => {
        mockStores.layoutStore.isSearchResultsPagePrev = false;
        mockStores.layoutStore.referrer = 'http://localhost:8080';

        render(<BackToReferrer {...mockProps} />);

        const button = screen.getByTestId('go-back-to-flights');
        await userEvent.click(button);

        expect(mockStores.trackingStore.trackBackToFlightsClick).toHaveBeenCalledWith(
            button.attributes.getNamedItem('href')?.value,
        );
    });
});
