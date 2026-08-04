import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockGuests } from 'frontend/__mocks__/guests';
import { GuestToEdit } from 'models/data/GuestToEdit';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { AmendPassengers } from 'frontend/components/renderings/AmendPassengers/AmendPassengers';

const mockEvent = {
    on: jest.fn(),
    off: jest.fn(),
};

jest.mock('next/router', () => ({
    useRouter: () => ({
        events: mockEvent,
    }),
}));

const mockPlaceholderComponent = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-react', () => ({
    __esModule: true,
    Placeholder: ({ children, ...props }) => {
        mockPlaceholderComponent(props);

        return (
            <div data-tid='placeholder'>
                {children}
                <button>onClose</button>
            </div>
        );
    },
    Text: ({ field }) => <div>{field?.value}</div>,
}));

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(v => v) },
    amendPassengerStore: {
        guestsToEdit: mockGuests.map(guest => new GuestToEdit(guest, '123')),
        submitError: undefined as any,
        isSubmitPending: false,
        isLoadingPassengers: false,
        resetSubmitError: jest.fn(),
        initialize: jest.fn(),
        clearStore: jest.fn(),
        haveUnsavedChanges: false,
        isSuccessfullySubmitted: false,
        amendPassengerNameCharacterCount: 3,
        isShowRestrictionInfoEnabled: false,
    },
    appStore: { isScreenMedium: true },
    trackingStore: {
        trackValidation: jest.fn(),
    },
    tracking: {
        onCommitPassengersNameChangeError: jest.fn(),
    },
    routerStore: {
        redirectTo: jest.fn(),
        redirectToViewBookingPage: jest.fn(),
        listenToPopState: jest.fn(() => jest.fn()),
    },
    userStore: {
        onLogout: jest.fn(),
    },
});

const renderWithLink = (linkProps = {}) => {
    const linkText = 'Test link';

    return render(
        <>
            <a {...linkProps}>{linkText}</a>
            <AmendPassengers {...(params as any)} />
        </>,
    );
};

let mockStores = createStores();
const params = {};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

describe('<AmendPassengers />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
    });

    it('Should render', () => {
        render(<AmendPassengers {...(params as any)} />);
        expect(screen.getByTestId('cancel-link')).toBeInTheDocument();
        expect(screen.getByTestId('submit-changes')).toBeInTheDocument();
    });

    it('Should call initialize on mount and clearStore on unmount', () => {
        const { unmount } = render(<AmendPassengers {...(params as any)} />);

        expect(mockStores.amendPassengerStore.initialize).toHaveBeenCalled();

        unmount();

        expect(mockStores.amendPassengerStore.clearStore).toHaveBeenCalled();
    });

    it('Should open ErrorPopup on submitError', () => {
        mockStores.amendPassengerStore.submitError = { status: 400, message: 'submitError' };
        render(<AmendPassengers {...(params as any)} />);

        expect(screen.getByTestId('generic-error-popup')).toBeInTheDocument();
    });

    it('Should render loading spinner on isSubmitPending', () => {
        mockStores.amendPassengerStore.isSubmitPending = true;
        const { container } = render(<AmendPassengers {...(params as any)} />);

        expect(container.querySelector('.overlay-spinner')).toBeInTheDocument();
    });

    it('Should call resetSubmitError on close ErrorPopup', async () => {
        mockStores.amendPassengerStore.submitError = { status: 400, message: 'submitError' };
        render(<AmendPassengers {...(params as any)} />);

        const closeBtn = screen.getByText(SitecoreDictionary.GlobalsButtonsClose);
        await userEvent.click(closeBtn);

        expect(mockStores.amendPassengerStore.resetSubmitError).toHaveBeenCalled();
        waitFor(() => expect(screen.queryByTestId('generic-error-popup')).not.toBeInTheDocument());
    });

    it('Should render null if guestsToEdit is empty', () => {
        mockStores.amendPassengerStore.guestsToEdit = [];
        const { container } = render(<AmendPassengers {...(params as any)} />);

        expect(container.firstChild).toBeNull();
    });

    it('NOT subscribes on beforeunload without changes', () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        render(<AmendPassengers {...(params as any)} />);
        expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload');
        expect(mockEvent.on).not.toBeCalled();

        addEventListenerSpy.mockRestore();
    });

    it('subscribes on beforeunload and unsubscribe after changes', () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        mockStores.amendPassengerStore.haveUnsavedChanges = true;

        const { unmount } = render(<AmendPassengers {...(params as any)} />);
        expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.anything(), expect.anything());
        expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.anything(), expect.anything());
        expect(mockStores.routerStore.listenToPopState).toHaveBeenCalled();
        unmount();
        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.anything(), expect.anything());
        expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.anything(), expect.anything());

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    it('redirects after isSuccessfullySubmitted', () => {
        mockStores.amendPassengerStore.isSuccessfullySubmitted = true;
        mockStores.amendPassengerStore.haveUnsavedChanges = true;

        render(<AmendPassengers {...(params as any)} />);
        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.ViewBooking);
    });

    it('not prevents fake link click', () => {
        mockStores.amendPassengerStore.haveUnsavedChanges = true;
        renderWithLink();
        const linkElement = screen.getByText('Test link');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        fireEvent(linkElement, clickEvent);

        expect(clickEvent.defaultPrevented).toBe(false);
    });

    it('prevents link click', () => {
        mockStores.amendPassengerStore.haveUnsavedChanges = true;
        renderWithLink({ href: 'example.com' });
        const linkElement = screen.getByText('Test link');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        fireEvent(linkElement, clickEvent);

        expect(clickEvent.defaultPrevented).toBe(true);
    });

    it('prevents logout click', () => {
        mockStores.amendPassengerStore.haveUnsavedChanges = true;
        renderWithLink({ ['data-logout']: true });
        const linkElement = screen.getByText('Test link');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        fireEvent(linkElement, clickEvent);

        expect(clickEvent.defaultPrevented).toBe(true);
    });

    it('not prevents link click when target is _blank', () => {
        renderWithLink({ target: '_blank' });

        const linkElement = screen.getByText('Test link');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        fireEvent(linkElement, clickEvent);

        expect(clickEvent.defaultPrevented).toBe(false);
    });

    it('not prevents link click when href is empty or only contains http(s):// or #', () => {
        renderWithLink({ href: 'https://' });

        const linkElement = screen.getByText('Test link');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        fireEvent(linkElement, clickEvent);

        expect(clickEvent.defaultPrevented).toBe(false);
    });

    it('not prevents link click when href is a tel', () => {
        renderWithLink({ href: 'tel:+1234567890' });

        const linkElement = screen.getByText('Test link');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        fireEvent(linkElement, clickEvent);

        expect(clickEvent.defaultPrevented).toBe(false);
    });

    it('should show restriction info if isShowRestrictionInfoEnabled is true', () => {
        mockStores.amendPassengerStore.isShowRestrictionInfoEnabled = true;

        render(<AmendPassengers {...(params as any)} />);

        expect(mockPlaceholderComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.AttentionMessage,
                rendering: undefined,
                className: expect.any(String),
                tokenizer: expect.any(Object),
            }),
        );
    });
});
