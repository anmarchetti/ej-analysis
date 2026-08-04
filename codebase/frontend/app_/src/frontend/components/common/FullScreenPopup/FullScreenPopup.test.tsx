import React, { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { setBodyOverflow } from 'frontend/utils/ui.utils';

import { FullScreenPopup, IFullScreenPopupProps } from './FullScreenPopup';

jest.mock('frontend/utils/ui.utils');

const mockPopupComponent = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...props }) => {
        mockPopupComponent(props);

        return <div data-tid='popup'>{children}</div>;
    },
}));

describe('FullScreenPopup', () => {
    const resetMocks = (): PropsWithChildren<IFullScreenPopupProps> => ({
        navigationActionBlock: <div data-tid='navigation-action-block' />,
        children: <div data-tid='children' />,
        fields: {
            BackToLabel: mockSitecoreField('BackToLabel'),
            BtnCancel: mockSitecoreField('BtnCancel'),
        },
        onClose: jest.fn(),
        isMobile: false,
        isInnerPopup: true,
        popupBarContent: <div data-tid='popup-bar-content' />,
        isInitialized: true,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render FullScreenPopup', () => {
        render(<FullScreenPopup {...mocks} />);

        expect(mockPopupComponent).toHaveBeenCalledWith({
            removeDefaultClasses: true,
            isCentered: false,
            containerClass: 'popup popup--opened',
            dialogClass: 'popupDialog',
            contentClass: 'popupContent',
            bodyClass: 'popupBody',
            isInnerPopup: true,
        });
        expect(screen.queryByTestId('children')).toBeInTheDocument();
        expect(screen.queryByTestId('navigation-action-block')).toBeInTheDocument();
        expect(screen.queryByTestId('popup-bar-content')).toBeInTheDocument();
        expect(screen.queryByTestId('popup-back-btn')).toHaveTextContent('BackToLabel');
    });

    it('should render without navigationActionBlock if not provided', () => {
        delete mocks.navigationActionBlock;

        render(<FullScreenPopup {...mocks} />);

        expect(screen.queryByTestId('navigation-action-block')).not.toBeInTheDocument();
    });

    describe('isMobile', () => {
        beforeEach(() => {
            mocks.isMobile = true;
        });

        it('should add popupBarMobile class to popupBar', () => {
            const { container } = render(<FullScreenPopup {...mocks} />);

            const el = container.querySelector('.popupBar');

            expect(el).toHaveClass('popupBarMobile');
        });

        it('should render BackToLabel button', () => {
            render(<FullScreenPopup {...mocks} />);

            expect(screen.queryByTestId('popup-cancel-btn')).toHaveTextContent('BtnCancel');
        });
    });

    it('should setBodyOverflow', () => {
        const { unmount } = render(<FullScreenPopup {...mocks} />);

        expect(setBodyOverflow).toBeCalledWith('hidden');

        unmount();

        expect(setBodyOverflow).toBeCalledWith('');
    });
});
