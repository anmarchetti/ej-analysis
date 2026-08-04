import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { CreditExpiryState } from 'models/data/MyCreditInfo';
import RefundInfoPopup from 'frontend/components/renderings/ViewBooking/RefundInfoPopup';

const mockFloatingPopupComponent = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: ({ children, footerContent, ...props }) => {
        mockFloatingPopupComponent(props);

        return (
            <div data-tid='floating-popup'>
                {children}
                {footerContent}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => (
        <div data-tid='rich-text'>
            RichTextWithLinks <span>{field?.value}</span>
        </div>
    ),
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field, tag, ...props }) => {
        const Tag = tag || 'span';

        return <Tag {...props}>{field?.value}</Tag>;
    },
}));

const createProps = () => ({
    ExpiryPopupCTA: mockSitecoreField('Continue to cancel'),
    ExpiryPopupCancelCTA: mockSitecoreField('Back to view booking'),
    isOpened: true,
    onClosePopup: jest.fn(),
    onClickButton: jest.fn(),
    creditExpiryPopupFields: {
        CreditExpiryState: mockSitecoreField(CreditExpiryState.ExpiredOnly),
        Title: mockSitecoreField('Credit has expired'),
        Subheading: mockSitecoreField('Important notice'),
        Text: mockSitecoreField('Your credit has expired and cannot be refunded.'),
    },
});

let mockProps;

describe('<RefundInfoPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockFloatingPopupComponent.mockClear();
    });

    it('should render FloatingPopup with content', () => {
        render(<RefundInfoPopup {...mockProps} />);

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(screen.getByText('Credit has expired')).toBeInTheDocument();
        expect(screen.getByText('Important notice')).toBeInTheDocument();
    });

    it('should render RichTextWithLinks with Text field', () => {
        render(<RefundInfoPopup {...mockProps} />);

        expect(screen.getByTestId('rich-text')).toBeInTheDocument();
        expect(screen.getByText('Your credit has expired and cannot be refunded.')).toBeInTheDocument();
    });

    it('should NOT render when isOpened is false', () => {
        mockProps.isOpened = false;

        const { container } = render(<RefundInfoPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when creditExpiryPopupFields is undefined', () => {
        mockProps.creditExpiryPopupFields = undefined;

        const { container } = render(<RefundInfoPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call onClosePopup when close button is clicked', () => {
        render(<RefundInfoPopup {...mockProps} />);
        const closeButton = screen.getByTestId('close-popup-button');

        fireEvent.click(closeButton);

        expect(mockProps.onClosePopup).toHaveBeenCalled();
    });

    it('should call onClickButton when continue button is clicked', () => {
        render(<RefundInfoPopup {...mockProps} />);
        const continueButton = screen.getByTestId('continue-popup-button');

        fireEvent.click(continueButton);

        expect(mockProps.onClickButton).toHaveBeenCalled();
    });

    it('should render button labels from props', () => {
        render(<RefundInfoPopup {...mockProps} />);

        expect(screen.getByText('Continue to cancel')).toBeInTheDocument();
        expect(screen.getByText('Back to view booking')).toBeInTheDocument();
    });

    it('should not render title section when Title is falsy', () => {
        mockProps.creditExpiryPopupFields.Title = null;

        render(<RefundInfoPopup {...mockProps} />);

        expect(screen.queryByText('Credit has expired')).not.toBeInTheDocument();
    });
});
