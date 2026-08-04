import React from 'react';
import { render } from '@testing-library/react';

import AmendGuestCardActions from './AmendGuestCardActions';

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(v => v),
    },
    appStore: {
        isScreenMedium: false,
    },
});

const getProps = () => ({
    guest: { isCheckPending: false, closeCard: jest.fn() },
    fields: {
        SavePassengerDetailsCTA: {
            value: 'SavePassengerDetailsCTA',
        },
    },
    disabled: false,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendGuestCardActions />', () => {
    beforeEach(() => {
        mockProps = getProps();
        mockStores = createStores();
    });

    it('Should render passed props', () => {
        const { getByText } = render(<AmendGuestCardActions {...mockProps} />);

        expect(getByText('Globals.Buttons.Close')).toBeInTheDocument();
        expect(getByText('Globals.Buttons.Update')).toBeInTheDocument();
    });

    it('Should render desktop button label', () => {
        mockStores.appStore.isScreenMedium = true;
        const { getByText } = render(<AmendGuestCardActions {...mockProps} />);

        expect(getByText('SavePassengerDetailsCTA')).toBeInTheDocument();
    });
});
