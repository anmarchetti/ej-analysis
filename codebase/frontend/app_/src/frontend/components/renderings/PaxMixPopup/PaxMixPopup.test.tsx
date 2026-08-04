import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { GuestInfo } from 'models/GuestInfo';
import { RoomAllocation } from 'models/RoomAllocation';

import PaxMixPopup, { IPaxMixPopupFields } from './PaxMixPopup';

const createStores = () => ({
    appStore: { setWasPopunderShown: jest.fn() },
    searchStore: {
        searchWho: {
            isChildrenAgeValid: false,
            isTotalGuestsQuantityReached: false,
            isTotalGuestQuantityValid: true,
            isWhoParamsValid: false,
            roomsAllocation: [] as RoomAllocation[],
            mergeRoomsIntoOne: jest.fn(),
            validateChildrenAge: jest.fn(() => true),
        },
        validateWhoParameters: jest.fn(() => false),
    },
    layoutStore: { getPhrase: jest.fn(p => p), isPaxMixPopupEnabled: true },
    bookingStore: { grabSearchValuesFromSearchStore: jest.fn() },
    queryParamStore: { isReferer: true, needOpenSearchPodWhoField: jest.fn(() => true) },
});

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Subtitle: mockSitecoreField('Subtitle'),
    } as IPaxMixPopupFields,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RoomAllocationGroup/RoomAllocationGroup', () => () => (
    <div data-tid='room-allocation-group' />
));

jest.mock('frontend/components/common/Drawer', () => () => <div data-tid='drawer' />);

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

jest.mock('frontend/components/common/SearchBarFieldErrorMessage/SearchBarFieldErrorMessage', () => ({
    __esModule: true,
    default: () => <div data-tid='field-error-message' />,
}));

const mockUseSubmitSearchParameters = {
    onSubmitSearchParameters: jest.fn(),
};

jest.mock('frontend/hooks/useSubmitSearchParameters/useSubmitSearchParameters', () => ({
    __esModule: true,
    useSubmitSearchParameters: () => mockUseSubmitSearchParameters,
}));

jest.mock('frontend/hooks/useMediaQuery');

describe('<PaxMixPopup />', () => {
    beforeEach(() => {
        jest.mocked(useMobileViewport).mockReturnValue(false);
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render Popup when isMobile = false and isOpen = true', () => {
        render(<PaxMixPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
    });

    it('should render Drawer when screen isMobile = true', () => {
        jest.mocked(useMobileViewport).mockReturnValue(true);
        render(<PaxMixPopup {...mockProps} />);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    it('should render title and description', () => {
        render(<PaxMixPopup {...mockProps} />);

        expect(screen.getByTestId('pax-mix-popup-title')).toHaveTextContent(mockProps.fields.Title.value);
        expect(screen.getByTestId('pax-mix-popup-description')).toHaveTextContent(mockProps.fields.Subtitle.value);
    });

    it('should NOT render rooms allocation group if no allocation group', () => {
        render(<PaxMixPopup {...mockProps} />);

        expect(screen.queryByTestId('room-allocation-group')).not.toBeInTheDocument();
    });

    it('should render 2 rooms allocation groups', () => {
        mockStores.searchStore.searchWho.roomsAllocation = [
            {
                id: 1,
                adults: [] as GuestInfo[],
                children: [] as GuestInfo[],
                infants: [] as GuestInfo[],
            },
            {
                id: 2,
                adults: [] as GuestInfo[],
                children: [] as GuestInfo[],
                infants: [] as GuestInfo[],
            },
        ] as RoomAllocation[];
        render(<PaxMixPopup {...mockProps} />);

        expect(screen.getAllByTestId('room-allocation-group')).toHaveLength(
            mockStores.searchStore.searchWho.roomsAllocation.length,
        );
    });

    it('should render button', () => {
        render(<PaxMixPopup {...mockProps} />);

        expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsSearch);
    });

    it('should render error message', () => {
        render(<PaxMixPopup {...mockProps} />);

        expect(screen.getByTestId('field-error-message')).toBeInTheDocument();
    });

    it('should call setWasPopunderShown, grabSearchValuesFromSearchStore and onSubmitSearchParameters on button click when form is valid', async () => {
        render(<PaxMixPopup {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mockStores.appStore.setWasPopunderShown).toHaveBeenCalled();
        expect(mockStores.bookingStore.grabSearchValuesFromSearchStore).toHaveBeenCalled();
        expect(mockUseSubmitSearchParameters.onSubmitSearchParameters).toHaveBeenCalled();
    });

    it('should NOT call setWasPopunderShown, grabSearchValuesFromSearchStore and onSubmitSearchParameters on button click when validateWhoParameters is true', async () => {
        mockStores.searchStore.validateWhoParameters = jest.fn(() => true);
        render(<PaxMixPopup {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mockStores.appStore.setWasPopunderShown).not.toHaveBeenCalled();
        expect(mockStores.bookingStore.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
        expect(mockUseSubmitSearchParameters.onSubmitSearchParameters).not.toHaveBeenCalled();
    });

    it('should NOT call setWasPopunderShown, grabSearchValuesFromSearchStore and onSubmitSearchParameters on button click when validateChildrenAge is false', async () => {
        mockStores.searchStore.searchWho.validateChildrenAge = jest.fn(() => false);
        render(<PaxMixPopup {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mockStores.appStore.setWasPopunderShown).not.toHaveBeenCalled();
        expect(mockStores.bookingStore.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
        expect(mockUseSubmitSearchParameters.onSubmitSearchParameters).not.toHaveBeenCalled();
    });

    it('should NOT render when fields is null', () => {
        mockProps.fields = null;
        const { container } = render(<PaxMixPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('PaxMixPopup NOT open', () => {
        it('should NOT render when isMobile = false and is isPaxMixPopupEnabled false', () => {
            mockStores.layoutStore.isPaxMixPopupEnabled = false;
            const { container } = render(<PaxMixPopup {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should NOT render when isMobile = false and is isReferer false', () => {
            mockStores.queryParamStore.isReferer = false;
            const { container } = render(<PaxMixPopup {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should NOT render when isMobile = false and is isReferer false', () => {
            mockStores.queryParamStore.hasOpenWhoFieldQueryParam = jest.fn(() => false);
            const { container } = render(<PaxMixPopup {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });
});
