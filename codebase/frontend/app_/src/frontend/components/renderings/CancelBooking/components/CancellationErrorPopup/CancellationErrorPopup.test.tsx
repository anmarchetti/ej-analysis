import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import {
    errorPopupFieldsMock,
    infoErrorPopupFieldsMock,
} from 'frontend/components/renderings/CancelBooking/__mocks__/mockFields';

import CancellationErrorPopup, { TCancellationErrorPopupProps } from './CancellationErrorPopup';

const createProps = (): TCancellationErrorPopupProps => ({
    fields: { ...errorPopupFieldsMock, ...infoErrorPopupFieldsMock },
});

const createStores = () =>
    createMockStores({
        routerStore: {
            redirectToViewBookingPage: jest.fn(),
        },
        holidayCreditStore: {
            isCancellationSummaryFailed: false,
            isCreditBookingFailed: true,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFloatingPopupProps = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: props => {
        mockFloatingPopupProps(props);

        return (
            <div data-tid='floating-popup'>
                {props.footerContent}
                {props.children}
            </div>
        );
    },
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='jss-text' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

describe('<CancellationErrorPopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should NOT render if isCreditBookingFailed and isCancellationSummaryFailed are false', () => {
        mockStores.holidayCreditStore.isCreditBookingFailed = false;
        const { container } = render(<CancellationErrorPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render standard with errorPopup fields', () => {
        render(<CancellationErrorPopup {...mockProps} />);

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(mockFloatingPopupProps).toHaveBeenCalledWith({
            contentClass: 'popup',
            onClose: mockStores.routerStore.redirectToViewBookingPage,
            footerContent: expect.anything(),
            children: expect.anything(),
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields.ErrorPopupDescription,
            className: 'description',
            dataId: 'cancellation-error-description',
        });

        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields.ErrorPopupTitle,
            className: 'title',
            tag: 'h4',
            'data-tid': 'cancellation-error-title',
        });

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockStores.routerStore.redirectToViewBookingPage,
            isFullWidth: true,
            'aria-label': mockProps.fields.ErrorPopupButtonLabel.value,
            children: mockProps.fields.ErrorPopupButtonLabel.value,
            dataTid: 'cancellation-error-button',
        });
    });

    it('should render right popup content when cancellation summary loading is failed', () => {
        mockStores.holidayCreditStore.isCancellationSummaryFailed = true;
        mockStores.holidayCreditStore.isCreditBookingFailed = false;
        render(<CancellationErrorPopup {...mockProps} />);

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(mockFloatingPopupProps).toHaveBeenCalledWith({
            contentClass: 'popup',
            onClose: mockStores.routerStore.redirectToViewBookingPage,
            footerContent: expect.anything(),
            children: expect.anything(),
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields.FailedToLoadPopupDescription,
            className: 'description',
            dataId: 'cancellation-error-description',
        });

        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields.FailedToLoadPopupTitle,
            className: 'title',
            tag: 'h4',
            'data-tid': 'cancellation-error-title',
        });

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockStores.routerStore.redirectToViewBookingPage,
            isFullWidth: true,
            'aria-label': mockProps.fields.FailedToLoadPopupButtonLabel.value,
            children: mockProps.fields.FailedToLoadPopupButtonLabel.value,
            dataTid: 'cancellation-error-button',
        });
    });
});
