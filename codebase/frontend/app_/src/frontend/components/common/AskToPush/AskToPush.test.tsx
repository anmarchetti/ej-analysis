import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';

import AskToPush from './AskToPush';

jest.mock('frontend/components/icons-new/Bell.tsx', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-bell' />,
}));

const mockAnimatedPopupComponent = jest.fn();
jest.mock('frontend/components/common/AnimatedPopup/AnimatedPopup', () => ({
    __esModule: true,
    default: ({ content, onClose, firstButton, ...props }) => {
        mockAnimatedPopupComponent(props);

        return (
            <div data-tid='popup' onClick={onClose}>
                {content}

                <button data-tid={firstButton.dataTid} onClick={firstButton.onClick} onKeyDown={jest.fn()}>
                    {firstButton.content}
                </button>
            </div>
        );
    },
}));

const createStores = () => ({
    layoutStore: {
        getSetting: jest.fn(key => settings[key]),
        getPhrase: jest.fn(p => p),
        setIsNotificationsTimerStarted: jest.fn(),
    },
    notificationsStore: {
        isAskNotificationsShown: true,
        subscribeToPushNotifications: jest.fn(() => Promise.resolve()),
        denyNotifications: jest.fn(),
    },
    appStore: {
        isCookiesPopupWasShown: true,
    },
    routerStore: {},
});

const createSettings = () => ({
    [SiteSettings.IsAskToSubscribePopupEnabled]: '1',
    [SiteSettings.AskNotificationsTitle]: 'AskNotificationsTitle',
    [SiteSettings.AskNotificationsDescription]: 'AskNotificationsDescription',
});

let settings = createSettings();
let mockStores = createStores();
const user = userEvent.setup({ delay: 0 });

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AskToPush />', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockStores = createStores();
        settings = createSettings();
    });

    it('should render popup with false isShown when isAskNotificationsShown is false', () => {
        mockStores.notificationsStore.isAskNotificationsShown = false;

        render(<AskToPush />);

        expect(mockAnimatedPopupComponent).toHaveBeenCalledWith({
            showCloseButton: true,
            isShown: false,
        });
    });

    it('should render popup with false isShown when isCookiesPopupWasShown is false', () => {
        mockStores.appStore.isCookiesPopupWasShown = false;

        render(<AskToPush />);

        expect(mockAnimatedPopupComponent).toHaveBeenCalledWith({
            showCloseButton: true,
            isShown: false,
        });
    });

    it('should render popup with false isShown when IsAskToSubscribePopupEnabled is disabled', () => {
        settings[SiteSettings.IsAskToSubscribePopupEnabled] = '';

        render(<AskToPush />);

        expect(mockAnimatedPopupComponent).toHaveBeenCalledWith({
            showCloseButton: true,
            isShown: false,
        });
    });

    it('should render elements correctly', () => {
        render(<AskToPush />);
        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
        expect(screen.getByText('AskNotificationsTitle')).toBeInTheDocument();
        expect(screen.getByText('AskNotificationsDescription')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.NotificationsButtonsAllow);

        expect(mockAnimatedPopupComponent).toHaveBeenCalledWith({
            showCloseButton: true,
            isShown: true,
        });
    });

    it('should call subscribeToPushNotifications and setIsNotificationsTimerStarted on apply click', async () => {
        render(<AskToPush />);

        user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(mockStores.notificationsStore.subscribeToPushNotifications).toHaveBeenCalled();
            expect(mockStores.layoutStore.setIsNotificationsTimerStarted).toHaveBeenCalledWith(false);
        });
    });

    it('should call denyNotifications and setIsNotificationsTimerStarted on close click', async () => {
        render(<AskToPush />);

        user.click(screen.getByTestId('popup'));

        await waitFor(() => {
            expect(mockStores.notificationsStore.denyNotifications).toHaveBeenCalled();
            expect(mockStores.layoutStore.setIsNotificationsTimerStarted).toHaveBeenCalledWith(false);
        });
    });
});
