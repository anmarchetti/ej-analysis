import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { SingleUsePromoCodePopup } from './SingleUsePromoCodePopup';

const mockGetSingleUsePromoCode = jest.fn();
const mockPopupProps = jest.fn();
const mockSendImpressionEvent = jest.fn();
const mockSendClickEvent = jest.fn();
const mockCopyToClipboard = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();
let mockIsMobile = false;

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockIsMobile,
}));

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: (selector: any) =>
        selector({
            userStore: {
                getSingleUsePromoCode: mockGetSingleUsePromoCode,
            },
            engageStore: {
                sendImpressionEvent: mockSendImpressionEvent,
                sendClickEvent: mockSendClickEvent,
            },
        }),
}));

jest.mock('frontend/store/holidays/create-stores', () => ({
    __esModule: true,
    isHolidayStore: () => true,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, onClose, ...props }: any) => {
        mockPopupProps(props);

        return (
            <div data-tid='popup'>
                <button data-tid='popup-close' onClick={() => onClose?.()}>
                    close
                </button>
                {children}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, ...props }: any) => (
        <button onClick={onClick} {...props}>
            {children}
        </button>
    ),
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: ({ field }) => <div>{field.value}</div>,
}));

jest.mock('frontend/utils/clipboard.utils', () => ({
    __esModule: true,
    copyToClipboard: (...args: any[]) => mockCopyToClipboard(...args),
}));

jest.mock('frontend/services/logging', () => ({
    __esModule: true,
    logger: {
        info: (...args: any[]) => mockLoggerInfo(...args),
        error: (...args: any[]) => mockLoggerError(...args),
    },
}));

const createProps = () =>
    ({
        rendering: { uid: '109a532f-3629-42d2-abc2-9a450478cec0' },
        fields: {
            ButtonLabel: mockSitecoreField('Copy code'),
            CampaignId: mockSitecoreField('campaign-id'),
            CopiedConfirmation: mockSitecoreField('Copied'),
            Description: mockSitecoreField('Description text'),
            MobileTitle: mockSitecoreField('Welcome back!'),
            MotivationLabel: mockSitecoreField('Use your unique offer code below at checkout!'),
            Title: mockSitecoreField('Welcome back!'),
        },
    } as any);

describe('<SingleUsePromoCodePopup />', () => {
    beforeEach(() => {
        mockIsMobile = false;
    });

    it('should copy raw promo code on button click', async () => {
        mockGetSingleUsePromoCode.mockResolvedValueOnce('1234ABCD1234ABCD1234');
        mockCopyToClipboard.mockResolvedValueOnce(undefined);
        const sessionStorageSetItemSpy = jest.spyOn(globalThis.sessionStorage, 'setItem');

        render(<SingleUsePromoCodePopup {...createProps()} />);

        const copyButton = await screen.findByRole('button', { name: 'Copy code' });
        await userEvent.click(copyButton);

        expect(mockCopyToClipboard).toHaveBeenCalledWith('1234ABCD1234ABCD1234');
        expect(sessionStorageSetItemSpy).toHaveBeenCalledWith(WebStorageKeys.IsUserPromoClosed, JSON.stringify(true));
        expect(mockSendClickEvent).toHaveBeenCalledWith(
            'campaign-id',
            '109a532f-3629-42d2-abc2-9a450478cec0',
            EventTypes.SingleUsePromoCodePopup,
            '1234ABCD1234ABCD1234',
        );
        expect(mockLoggerInfo).toHaveBeenCalledWith('SingleUsePromoCodePopup copied: 1234ABCD1234ABCD1234');

        sessionStorageSetItemSpy.mockRestore();
    });

    it('should close popup when close is clicked', async () => {
        mockGetSingleUsePromoCode.mockResolvedValueOnce('1234ABCD1234ABCD1234');
        const sessionStorageSetItemSpy = jest.spyOn(globalThis.sessionStorage, 'setItem');

        render(<SingleUsePromoCodePopup {...createProps()} />);

        expect(await screen.findByTestId('popup')).toBeInTheDocument();
        await userEvent.click(screen.getByTestId('popup-close'));

        await waitFor(() => {
            expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
        });
        expect(sessionStorageSetItemSpy).toHaveBeenCalledWith(WebStorageKeys.IsUserPromoClosed, JSON.stringify(true));
        expect(mockLoggerInfo).toHaveBeenCalledWith('SingleUsePromoCodePopup closed: 1234ABCD1234ABCD1234');

        sessionStorageSetItemSpy.mockRestore();
    });

    it('should use toast popup mode on desktop and modal mode on mobile', async () => {
        mockGetSingleUsePromoCode.mockResolvedValueOnce('1234ABCD1234ABCD1234');

        const { unmount } = render(<SingleUsePromoCodePopup {...createProps()} />);

        await screen.findByTestId('popup');
        expect(mockPopupProps).toHaveBeenCalledWith(expect.objectContaining({ isToastPopup: true }));

        unmount();

        mockGetSingleUsePromoCode.mockResolvedValueOnce('1234ABCD1234ABCD1234');
        mockIsMobile = true;

        render(<SingleUsePromoCodePopup {...createProps()} />);

        await screen.findByTestId('popup');
        await waitFor(() => {
            expect(mockPopupProps).toHaveBeenCalledWith(expect.objectContaining({ isToastPopup: false }));
        });
    });

    it('should track popup view when promo code popup is shown', async () => {
        mockGetSingleUsePromoCode.mockResolvedValueOnce('1234ABCD1234ABCD1234');

        render(<SingleUsePromoCodePopup {...createProps()} />);

        await screen.findByTestId('popup');

        expect(mockSendImpressionEvent).toHaveBeenCalledTimes(1);
        expect(mockSendImpressionEvent).toHaveBeenCalledWith(
            'campaign-id',
            '109a532f-3629-42d2-abc2-9a450478cec0',
            EventTypes.SingleUsePromoCodePopup,
        );
        expect(mockLoggerInfo).toHaveBeenCalledWith('SingleUsePromoCodePopup viewed: 1234ABCD1234ABCD1234');
    });
});
