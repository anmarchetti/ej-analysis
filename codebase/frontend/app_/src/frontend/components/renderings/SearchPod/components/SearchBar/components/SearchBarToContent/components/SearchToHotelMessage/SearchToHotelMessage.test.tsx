import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import SearchToHotelMessage from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarToContent/components/SearchToHotelMessage/SearchToHotelMessage';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

const createProps = () => ({
    onApplySearchToHotel: jest.fn(),
    onClose: jest.fn(),
});

const createStores = () => ({
    layoutStore: { getSetting: jest.fn(p => p) },
    bookingStore: { hotel: { name: 'hotel' } },
    searchStore: { selectHotelBookAsDestination: jest.fn() },
});

let mockProps;
let mockStores = createStores();
let mockLocalStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/SearchBarInputCallout/SearchBarInputCallout', () => ({
    __esModule: true,
    default: ({ icon, text, title }) => (
        <div data-tid='search-bar-input-callout'>
            <div data-tid='text'>{text}</div>
            <div data-tid='title'>{title}</div>
            {icon}
        </div>
    ),
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

describe('<SearchToHotelMessage />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockLocalStore = createMockLocalStore();
    });

    it('should NOT render when hotel data NOT provided', () => {
        mockStores.bookingStore.hotel = null as any;
        const { container } = render(<SearchToHotelMessage {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render callout with SearchToHotelMessageTitle', () => {
        const { getByText } = render(<SearchToHotelMessage {...mockProps} />);

        expect(getByText(mockLocalStore.fields.SearchToHotelMessageTitle.value)).toBeInTheDocument();
    });

    it('should add/remove EventListener on mount/unmount', () => {
        const mockAddEventListener = jest.spyOn(document, 'addEventListener');
        const mockRemoveEventListener = jest.spyOn(document, 'removeEventListener');

        const { unmount } = render(<SearchToHotelMessage {...mockProps} />);

        expect(mockAddEventListener).toHaveBeenCalled();
        unmount();
        expect(mockRemoveEventListener).toHaveBeenCalled();
    });

    it('should call onClose on mount when click is outside the callout', () => {
        render(<SearchToHotelMessage {...mockProps} />);

        fireEvent.mouseDown(screen.getByTestId('search-bar-input-callout'));

        expect(mockProps.onClose).toHaveBeenCalled();
        expect(mockStores.searchStore.selectHotelBookAsDestination).not.toHaveBeenCalled();
        expect(mockProps.onApplySearchToHotel).not.toHaveBeenCalled();
    });

    it('should render callout with SearchToHotelMessageText', () => {
        const { getByText } = render(<SearchToHotelMessage {...mockProps} />);

        expect(getByText(mockLocalStore.fields.SearchToHotelMessageText.value)).toBeInTheDocument();
    });

    it('should render callout without text, title and icon if fields are undefined', () => {
        mockLocalStore.fields = undefined;
        const { getByTestId } = render(<SearchToHotelMessage {...mockProps} />);

        expect(getByTestId('text')).toBeEmptyDOMElement();
        expect(getByTestId('title')).toBeEmptyDOMElement();
    });

    it('should render icon', () => {
        const { container } = render(<SearchToHotelMessage {...mockProps} />);

        expect(container.getElementsByClassName('icon--bg-image')[0]).toHaveAttribute(
            'style',
            'background-image: url(new-icon.png);',
        );
    });

    it('should NOT render icon when no iconUrl', () => {
        mockLocalStore.fields.SearchToHotelMessageIcon.value.src = '';
        const { container } = render(<SearchToHotelMessage {...mockProps} />);

        expect(container.getElementsByClassName('icon--bg-image').length).toBe(0);
    });
});
