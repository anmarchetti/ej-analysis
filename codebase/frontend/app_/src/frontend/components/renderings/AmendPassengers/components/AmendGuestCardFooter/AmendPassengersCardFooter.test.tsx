import React from 'react';
import { render } from '@testing-library/react';

import { GuestType } from 'models/enum/GuestType';
import AmendGuestCardFooter from 'frontend/components/renderings/AmendPassengers/components/AmendGuestCardFooter/AmendGuestCardFooter';

const createProps = () => ({
    guest: {
        index: '1',
        age: 0,
        firstName: 'Ann',
        isLead: false,
        lastName: 'Brown',
        notBornYet: false,
        sex: 'SEX_FEMALE',
        title: 'Mrs',
        type: GuestType.Adult,
        isCheckPending: jest.fn(),
        closeCard: jest.fn(),
    },
    fields: {
        RemovePassengerBtnText: { value: 'RemovePassengerBtnText' },
    },
    onRemovePassenger: jest.fn(),
    disabled: false,
});

const createStores = () => ({
    appStore: { isScreenMedium: true },
    amendPassengerStore: {
        isChangePassengersCountAllowed: true,
    },
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('../AmendGuestCardActions/AmendGuestCardActions', () => ({
    __esModule: true,
    default: () => <div>AmendGuestCardActions</div>,
}));

describe('<AmendGuestCardFooter />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        mockProps = createProps();
    });

    it('Should render passed props', () => {
        const { getByText } = render(<AmendGuestCardFooter {...(mockProps as any)} />);

        expect(getByText('RemovePassengerBtnText')).toBeInTheDocument();
        expect(getByText('AmendGuestCardActions')).toBeInTheDocument();
    });

    it('Should render actions for mobile screen size', () => {
        mockStores.appStore.isScreenMedium = false;
        const { getByText } = render(<AmendGuestCardFooter {...(mockProps as any)} />);

        expect(getByText('AmendGuestCardActions')).toBeInTheDocument();
    });

    it('Should NOT render remove button', () => {
        mockStores.appStore.isScreenMedium = false;
        mockStores.amendPassengerStore.isChangePassengersCountAllowed = false;
        const { queryByText } = render(<AmendGuestCardFooter {...(mockProps as any)} />);

        expect(queryByText('RemovePassengerBtnText')).not.toBeInTheDocument();
    });
});
