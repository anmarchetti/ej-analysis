import React from 'react';
import { render } from '@testing-library/react';

import { SeatDropOffPopup } from 'frontend/components/renderings/AmendFlights/components/SeatDropOffPopup/SeatsDropOffPopup';

const createProps = () => ({
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
    });

    it('should render passed props', () => {
        const view = render(<SeatDropOffPopup {...mockProps} />);

        expect(view.getByText('title')).toBeInTheDocument();
        expect(view.getByText('description')).toBeInTheDocument();
        expect(view.getByText('backCTA')).toBeInTheDocument();
        expect(view.getByText('Globals.Buttons.Continue')).toBeInTheDocument();
    });
});
