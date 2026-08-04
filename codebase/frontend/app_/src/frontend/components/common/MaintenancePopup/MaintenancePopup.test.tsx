import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import MaintenancePopup from './MaintenancePopup';

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => (
        <div data-tid='popup'>
            <div data-tid='close'>
                <button onClick={() => props.onClose} />
            </div>
            <div data-tid='footer-content'>{props.footerContent}</div>
        </div>
    ),
}));

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), isMaintenance: true, isLoginPage: false, isTradePortal: true },
    appStore: { hideMaintenancePopup: jest.fn(), wasMaintenancePopupShown: false },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<MaintenancePopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('Should NOT render component when wasMaintenancePopupShown enabled', () => {
        mockStores.appStore.wasMaintenancePopupShown = true;
        const { container } = render(<MaintenancePopup />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render component when isMaintenance disabled', () => {
        mockStores.layoutStore.isMaintenance = false;
        const { container } = render(<MaintenancePopup />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render component when is TradeLoginPage', () => {
        mockStores.layoutStore.isTradePortal = true;
        mockStores.layoutStore.isLoginPage = true;
        const { container } = render(<MaintenancePopup />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render component', () => {
        render(<MaintenancePopup />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
    });

    it('Should set cookie on first render', () => {
        render(<MaintenancePopup />);

        expect(sessionStorage.setItem).toBeCalledWith(WebStorageKeys.IsMaintenancePopupWasShown, 'true');
    });

    it('should call hideMaintenancePopup on button click', async () => {
        render(<MaintenancePopup />);

        await userEvent.click(within(screen.getByTestId('footer-content')).getByText('MaintenancePopup.Buttons.GotIt'));

        waitFor(() => expect(mockStores.appStore.hideMaintenancePopup).toBeCalled());
    });

    it('should call hideMaintenancePopup onClose', async () => {
        render(<MaintenancePopup />);

        await userEvent.click(within(screen.getByTestId('close')).getByRole('button'));

        waitFor(() => expect(mockStores.appStore.hideMaintenancePopup).toBeCalled());
    });
});
