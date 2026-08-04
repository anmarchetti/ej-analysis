import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';

import { PrintButton } from './PrintButton';

expect.extend(toHaveNoViolations);

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={onClick} aria-label='button'>
                {children}
            </button>
        );
    },
}));

jest.mock('frontend/components/icons-new/PrinterFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='print-icon' />,
}));

describe('<PrintButton />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('Should render PrintButton', () => {
        render(<PrintButton />);

        expect(screen.getByTestId('print-icon')).toBeInTheDocument();
    });

    it('Should NOT render PrintButton on mobile', () => {
        mockStores.appStore.isScreenMedium = false;
        const { container } = render(<PrintButton />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should call window.print()', async () => {
        Object.defineProperty(window, 'print', {
            configurable: true,
        });
        window.print = jest.fn();

        render(<PrintButton />);

        const button = screen.getByTestId('button');
        await userEvent.click(button);

        expect(window.print).toHaveBeenCalled();
    });

    it('Should update style for chat bot', async () => {
        Object.defineProperty(window, 'print', {
            configurable: true,
        });
        window.print = jest.fn();

        render(<PrintButton />);

        const dfMessenger = document.createElement('df-messenger');
        const dfMessengerChat = document.createElement('df-messenger-chat');
        const dfMessageList = document.createElement('df-message-list');

        const dfMessengerShadow = dfMessenger.attachShadow({ mode: 'open' });
        const dfMessengerChatShadow = dfMessengerChat.attachShadow({ mode: 'open' });
        const dfMessageListShadow = dfMessageList.attachShadow({ mode: 'open' });
        dfMessageListShadow.innerHTML = '<div id="messageList"><div class="bot-animation"></div></div>';
        dfMessengerChatShadow.appendChild(dfMessageList);
        dfMessengerShadow.appendChild(dfMessengerChat);

        document.body.appendChild(dfMessenger);

        const button = screen.getByTestId('button');
        await userEvent.click(button);

        const botAnimationStyle = document
            .querySelector('df-messenger')!
            .shadowRoot!.querySelector('df-messenger-chat')!
            .shadowRoot!.querySelector('df-message-list')!
            .shadowRoot!.querySelector('#messageList .bot-animation')!
            .getAttribute('style');

        expect(botAnimationStyle).toBe('opacity: 1');
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<PrintButton />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
