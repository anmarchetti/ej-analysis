import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { RoomUnavailablePopup } from './RoomUnavailablePopup';

const createStores = () => ({
    appStore: {
        isScreenMedium: false,
    },
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    bookingStore: {
        setRoomUnavailablePopupShown: jest.fn(),
    },
});

let mockStores;

const mockPopupComponent = jest.fn();

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, onClose, ...props }) => {
        mockPopupComponent(props);

        return (
            <div data-tid='popup'>
                {children}
                <button onClick={onClose}>onClose</button>
            </div>
        );
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomUnavailablePopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<RoomUnavailablePopup />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopupComponent).toHaveBeenCalledWith({
            containerClass: 'holiday-unavailable room-unavailable-popup',
            title: SitecoreDictionary.RoomTypesLabelsRoomUnavailableTitle,
            isInnerPopup: false,
        });
        expect(
            screen
                .getByText(SitecoreDictionary.RoomTypesLabelsRoomUnavailableDescription)
                .classList.contains('additional-text'),
        ).toBeTruthy();
        expect(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsOK })).toBeInTheDocument();
    });

    it('should call setRoomUnavailablePopupShown when click on button', () => {
        render(<RoomUnavailablePopup />);

        fireEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsOK }));

        expect(mockStores.bookingStore.setRoomUnavailablePopupShown).toBeCalled();
    });

    it('should call setRoomUnavailablePopupShown when trigger popup onClose prop', () => {
        render(<RoomUnavailablePopup />);

        fireEvent.click(screen.getByRole('button', { name: 'onClose' }));

        expect(mockStores.bookingStore.setRoomUnavailablePopupShown).toBeCalled();
    });
});
