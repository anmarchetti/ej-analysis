import React from 'react';
import { render } from '@testing-library/react';

import AmendGuestCardName from 'frontend/components/renderings/AmendPassengers/components/AmendGuestCardName/AmendGuestCardName';

const guest = {
    init: jest.fn(),
    bookingReference: '70131736',
    editedDetails: {
        title: 'Mr',
        firstName: 'Vobla',
        lastName: 'Fisher',
        dateOfBirth: '1989-07-10T00:00:00+00:00',
        isLead: true,
        index: '1',
        notBornYet: false,
        age: 33,
        sex: 'SEX_MALE',
        type: 'ADULT',
    },
    isSelected: false,
    initialDetails: {
        title: 'Mr',
        firstName: 'Vobla',
        lastName: 'Fisher',
        dateOfBirth: '1989-07-10T00:00:00+00:00',
        isLead: true,
        index: '1',
        notBornYet: false,
        age: 33,
        sex: 'SEX_MALE',
        type: 'ADULT',
    },
    isCheckPending: false,
    tempName: 'Vobla',
    tempSurname: 'Fisher',
};

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(v => v) },
});

const getProps = () => ({
    guestToEdit: guest,
    newName: 'newName',
    prevName: 'prevName',
    age: 13,
    ageLabel: 'ageLabel',
    subtitle: 'subtitle',
});

let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendGuestCardName />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        mockProps = getProps();
    });

    it('Should render passed props', () => {
        const { queryByTestId, getByText } = render(<AmendGuestCardName {...mockProps} />);
        expect(queryByTestId('guest-age')).toBeInTheDocument();
        expect(queryByTestId('guest-old-name')).not.toBeInTheDocument();
        expect(queryByTestId('guest-new-name')).toHaveTextContent('newName' + '');
        expect(queryByTestId('guest-subtitle')).toHaveTextContent('subtitle');
        expect(getByText('BookingPassengers.Labels.LeadPassenger')).toBeInTheDocument();
    });

    it('Should not render lead passenger title', () => {
        mockProps.guestToEdit.initialDetails.isLead = false;
        const { queryByText } = render(<AmendGuestCardName {...mockProps} />);
        expect(queryByText('BookingPassengers.Labels.LeadPassenger')).not.toBeInTheDocument();
    });

    it('Should render old-name', () => {
        mockProps.guestToEdit.isEdited = true;
        mockProps.guestToEdit.isSelected = false;
        const { queryByTestId } = render(<AmendGuestCardName {...mockProps} />);
        expect(queryByTestId('guest-old-name')).toBeInTheDocument();
    });
});
