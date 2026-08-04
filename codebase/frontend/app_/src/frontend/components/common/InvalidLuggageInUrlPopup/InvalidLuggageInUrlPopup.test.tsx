import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import InvalidLuggageInUrlPopup from './InvalidLuggageInUrlPopup';

const createStores = () => ({
    bookingStore: {
        showInvalidLuggageInUrlPopup: false,
        setShowInvalidLuggageInUrlPopup: jest.fn(p => p),
    },
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    routerStore: {
        redirectToHomePage: jest.fn(),
    },
    notificationsStore: {
        isAskNotificationsShown: false,
    },
});

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPopupComponent = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...props }) => {
        mockPopupComponent(props);

        return <div data-tid='popup'>{children}</div>;
    },
}));

describe('InvalidLuggageInUrlPopup', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should NOT render anything when showInvalidLuggageInUrlPopup is false', () => {
        render(<InvalidLuggageInUrlPopup />);

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
    });

    it('should NOT render anything when isAskNotificationsShown is true', () => {
        mockStores.bookingStore.showInvalidLuggageInUrlPopup = true;
        mockStores.notificationsStore.isAskNotificationsShown = true;

        render(<InvalidLuggageInUrlPopup />);

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
    });

    describe('showInvalidLuggageInUrlPopup = true', () => {
        beforeEach(() => {
            mockStores.bookingStore.showInvalidLuggageInUrlPopup = true;
        });

        it('should render component', () => {
            render(<InvalidLuggageInUrlPopup />);

            expect(screen.getByTestId('popup')).toBeInTheDocument();
            expect(screen.getByTestId('popup')).toHaveTextContent(SitecoreDictionary.LuggageUrlPopupLabelsContent);
            expect(mockPopupComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    bodyClass: 'popupContent',
                    containerClass: 'popupContainer',
                    contentClass: 'popupContainer',
                    title: SitecoreDictionary.LuggageUrlPopupLabelsHeader,
                }),
            );
            expect(screen.getByTestId('back-button')).toBeInTheDocument();
            expect(screen.getByTestId('back-button')).toHaveClass('backBtn');
            expect(screen.getByTestId('back-button')).toHaveTextContent(
                SitecoreDictionary.LuggageUrlPopupButtonsBackToHomepage,
            );
        });

        it('should fire button event on click', () => {
            render(<InvalidLuggageInUrlPopup />);

            const button = screen.getByTestId('back-button');

            fireEvent.click(button);
            expect(mockStores.routerStore.redirectToHomePage).toBeCalled();
            expect(mockStores.bookingStore.setShowInvalidLuggageInUrlPopup).toBeCalledWith(false);
        });
    });
});
