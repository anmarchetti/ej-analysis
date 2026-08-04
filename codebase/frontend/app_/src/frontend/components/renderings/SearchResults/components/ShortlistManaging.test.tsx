import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';

import ShortlistManaging from './ShortlistManaging';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockIsTradeStore = false;
jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn(() => mockIsTradeStore),
}));

jest.mock('frontend/components/renderings/SearchResults/components/BookingInShortlistPopup', () => ({
    __esModule: true,
    default: () => <div data-tid='booking-in-shortlist-popup' />,
}));

jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: () => <div data-tid='overlay-spinner' />,
}));

jest.mock('frontend/components/renderings/Shortlists/components/ShortlistRemovePopup', () => ({
    __esModule: true,
    default: ({ onClose, onRemove }) => (
        <div data-tid='shortlist-remove-popup'>
            <button onClick={onClose} data-tid='close' />
            <button onClick={onRemove} data-tid='remove' />
        </div>
    ),
}));

let mockUseTabletViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useTabletViewport: () => mockUseTabletViewport,
}));

const createStores = () =>
    createMockStores({
        shortlistStore: {
            isShowBookingInShortlistPopup: false,
            isRemovePopupShown: false,
            candidate: null,
            toggleRemovePopup: jest.fn(),
            removeCandidateFromShortlist: jest.fn(),
            setCandidate: jest.fn(),
            isShortlistAdding: false,
            isShortlistEnabled: true,
        },
    });

let mockStores;

describe('<ShortlistManaging />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockIsTradeStore = false;
    });

    it('should NOT render component on trade', () => {
        mockIsTradeStore = true;
        const { container } = render(<ShortlistManaging />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when shortlist functionality is disabled', () => {
        mockStores.shortlistStore.isShortlistEnabled = false;
        const { container } = render(<ShortlistManaging />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render empty element when all show popup is false', () => {
        const { container } = render(<ShortlistManaging />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('BookingInShortlistPopup', () => {
        it('should render BookingInShortlistPopup when isShowBookingInShortlistPopup is true and screen is tablet or less', () => {
            mockStores.shortlistStore.isShowBookingInShortlistPopup = true;
            render(<ShortlistManaging />);

            expect(screen.getByTestId('booking-in-shortlist-popup')).toBeInTheDocument();
        });

        it('should NOT render BookingInShortlistPopup on tablet when isShowBookingInShortlistPopup is false', () => {
            mockStores.shortlistStore.isShowBookingInShortlistPopup = false;
            mockUseTabletViewport = true;
            render(<ShortlistManaging />);

            expect(screen.queryByTestId('booking-in-shortlist-popup')).not.toBeInTheDocument();
        });

        it('should NOT render BookingInShortlistPopup when screen is bigger than tablet', () => {
            mockStores.shortlistStore.isShowBookingInShortlistPopup = true;
            mockUseTabletViewport = false;
            render(<ShortlistManaging />);

            expect(screen.queryByTestId('booking-in-shortlist-popup')).not.toBeInTheDocument();
        });
    });

    describe('ShortlistRemovePopup', () => {
        it('should NOT render ShortlistRemovePopup when no candidate to remove', () => {
            mockStores.shortlistStore.isRemovePopupShown = true;
            render(<ShortlistManaging />);

            expect(screen.queryByTestId('shortlist-remove-popup')).not.toBeInTheDocument();
        });

        it('should render ShortlistRemovePopup', () => {
            mockStores.shortlistStore.isRemovePopupShown = true;
            mockStores.shortlistStore.candidate = mockedOffer;
            render(<ShortlistManaging />);

            expect(screen.getByTestId('shortlist-remove-popup')).toBeInTheDocument();
        });

        it('should close popup and reset candidate', () => {
            mockStores.shortlistStore.isRemovePopupShown = true;
            mockStores.shortlistStore.candidate = mockedOffer;
            render(<ShortlistManaging />);

            fireEvent.click(screen.getByTestId('close'));

            expect(mockStores.shortlistStore.setCandidate).toBeCalled();
            expect(mockStores.shortlistStore.toggleRemovePopup).toBeCalledWith(false);
        });

        it('should call delete candidate', () => {
            mockStores.shortlistStore.isRemovePopupShown = true;
            mockStores.shortlistStore.candidate = mockedOffer;
            render(<ShortlistManaging />);

            fireEvent.click(screen.getByTestId('remove'));

            expect(mockStores.shortlistStore.removeCandidateFromShortlist).toBeCalled();
        });
    });

    describe('OverlaySpinner', () => {
        it('should render OverlaySpinner', () => {
            mockStores.shortlistStore.isShortlistAdding = true;
            render(<ShortlistManaging />);

            expect(screen.getByTestId('overlay-spinner')).toBeInTheDocument();
        });
    });
});
