import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BookingErrorPopup from 'frontend/components/common/BookingErrorPopup';

const createStores = (isBookingFailed = true) => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    bookingStore: { isBookingFailed, setIsBookingFailed: jest.fn() },
    routerStore: {},
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});

let mockStores = createStores();

jest.mock('frontend/utils/ui.utils');
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BookingErrorPopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it(`Shouldn't render`, () => {
        const { getByText } = render(<BookingErrorPopup />);
        expect(getByText(SitecoreDictionary.BookingFailedLabelsTryAgain)).toBeInTheDocument();
    });

    it('Should render', () => {
        mockStores = createStores(false);
        const { queryByText } = render(<BookingErrorPopup />);
        expect(queryByText(SitecoreDictionary.BookingFailedLabelsTryAgain)).not.toBeInTheDocument();
    });

    it('Close Popup', () => {
        const { getByText } = render(<BookingErrorPopup />);
        fireEvent.click(getByText(SitecoreDictionary.BookingFailedButtonsTryAgain));
        expect(mockStores.bookingStore.setIsBookingFailed).toBeCalled();
    });
});
