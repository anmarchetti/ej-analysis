import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import BookingInShortlistPopup from './BookingInShortlistPopup';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons/Heart', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-heart' />,
}));

let mockIsMoreThenTabletScreen = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenTabletViewport: () => mockIsMoreThenTabletScreen,
}));

const createStores = () =>
    createMockStores({
        shortlistStore: {
            toggleShowBookingInShortlistPopup: jest.fn(),
            savePageBreadcrumbs: jest.fn(),
        },
        routerStore: {
            redirectToShortlistPage: jest.fn(),
        },
    });

let mockStores;

describe('<BookingInShortlistPopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should pin popup at the top if screen is large', () => {
        document.documentElement.scrollTop = 30;
        const { container } = render(<BookingInShortlistPopup />);

        expect(container.querySelector('.pinnedTop')).toBeInTheDocument();
    });

    it('should NOT pin popup at the top if screen is NOT large', () => {
        document.documentElement.scrollTop = 30;
        mockIsMoreThenTabletScreen = false;
        const { container } = render(<BookingInShortlistPopup />);

        expect(container.querySelector('.rightDialog')).toBeInTheDocument();
    });

    it('should NOT pin popup at the top if page was scrolled mote than 60 px', () => {
        document.documentElement.scrollTop = 100;
        const { container } = render(<BookingInShortlistPopup />);

        expect(container.querySelector('.rightDialog')).toBeInTheDocument();
    });

    it('openShortlistPage should hide popup and perform redirection', () => {
        render(<BookingInShortlistPopup />);

        fireEvent.click(screen.getByText(SitecoreDictionary.ShortlistBookingInShortlistPopupViewMyShortlist));

        expect(mockStores.shortlistStore.toggleShowBookingInShortlistPopup).toBeCalledWith(false);
        expect(mockStores.routerStore.redirectToShortlistPage).toBeCalled();
    });

    it('closePopup should hide popup', () => {
        render(<BookingInShortlistPopup />);

        fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsClose));

        expect(mockStores.shortlistStore.toggleShowBookingInShortlistPopup).toBeCalledWith(false);
    });

    it('should render heart icon', () => {
        render(<BookingInShortlistPopup />);

        expect(screen.getByTestId('icon-heart')).toBeInTheDocument();
    });
});
