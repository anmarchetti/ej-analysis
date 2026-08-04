import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { SeatDropOffPopup } from 'frontend/components/renderings/AmendFlights/components/SeatDropOffPopup/SeatsDropOffPopup';

const createProps = () => ({
    onClose: jest.fn(),
    onContinue: jest.fn(),
    title: {
        value: 'title',
    },
    description: {
        value: 'description',
    },
    backCTA: {
        value: 'backCTA',
    },
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    amendFlightsStore: { toggleNoAvailableFlightsPopup: jest.fn() },
    routerStore: {},
    appStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SeatDropOffPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        global.scrollTo = jest.fn();
    });

    it('should render correct text', () => {
        const { getByText, getByRole } = render(<SeatDropOffPopup {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('title');
        expect(getByText('description')).toBeInTheDocument();

        expect(getByRole('button', { name: 'backCTA' })).toBeInTheDocument();
        expect(getByRole('button', { name: SitecoreDictionary.GlobalsButtonsContinue })).toBeInTheDocument();
    });

    it('should call correct callback', () => {
        const { getByRole } = render(<SeatDropOffPopup {...mockProps} />);

        const backButton = getByRole('button', { name: 'backCTA' });
        const continueButton = getByRole('button', { name: SitecoreDictionary.GlobalsButtonsContinue });

        fireEvent.click(backButton);
        expect(mockProps.onClose).toBeCalled();
        expect(mockProps.onContinue).not.toBeCalled();

        fireEvent.click(continueButton);
        expect(mockProps.onContinue).toBeCalled();
    });
});
