import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { mockFields } from 'frontend/components/renderings/TradePortalGroupBooking/__mocks__/tradePortalGroupBookingFields';

import GroupBookingSuccess from './GroupBookingSuccess';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

const createProps = () => ({
    fields: mockFields,
});

const createStores = () => ({
    routerStore: {
        redirectToHomePage: jest.fn(),
    },
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<GroupBookingSuccess />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        mockProps = createProps();
    });

    it('renders component', () => {
        const { getByText } = render(<GroupBookingSuccess {...mockProps} />);
        expect(getByText(mockFields.SuccessTitle.value)).toBeInTheDocument();
        expect(getByText(mockFields.SuccessDescription.value)).toBeInTheDocument();
    });

    it('redirects to homepage', () => {
        const { getByText } = render(<GroupBookingSuccess {...mockProps} />);
        fireEvent.click(getByText(mockFields.BackToHomeCTAText.value));
        expect(mockStores.routerStore.redirectToHomePage).toBeCalled();
    });
});
