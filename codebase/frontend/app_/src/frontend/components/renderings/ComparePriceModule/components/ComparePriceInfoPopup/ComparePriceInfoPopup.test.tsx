import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ComparePriceInfoPopup from './ComparePriceInfoPopup';

const createProps = () => ({
    onClose: jest.fn(),
    shouldShow: true,
    type: 'confirm',
    icon: mockSitecoreField(mockSitecoreImageField('icon')),
    subtitle: mockSitecoreField('subtitle'),
    title: mockSitecoreField('title'),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    Popup: ({ children, footerContent, containerClass, ...props }) => {
        mockPopupProps(props);

        return (
            <div data-tid='popup' className={containerClass}>
                {children}
                {footerContent}
            </div>
        );
    },
}));

describe('<ComparePriceInfoPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should NOT render when shouldShow is false', () => {
        mockProps.shouldShow = false;

        const { container } = render(<ComparePriceInfoPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render popup with button, image, title and subtitle', () => {
        render(<ComparePriceInfoPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toHaveClass('infoPopup');
        expect(screen.getByTestId('confirm-popup-icon')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-popup-title')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-popup-subtitle')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsClose);

        expect(mockPopupProps).toHaveBeenCalledWith({
            contentClass: 'content',
            disableOutsideClick: true,
            isCentered: false,
            overlayClass: 'overlay priority',
            withPortal: true,
        });
    });

    it('should render popup with small className when isSmall is true', () => {
        mockProps.isSmall = true;

        render(<ComparePriceInfoPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toHaveClass('infoPopup small');
    });

    it('should call onClose on button click', async () => {
        render(<ComparePriceInfoPopup {...mockProps} />);

        const button = screen.getByRole('button');
        await userEvent.click(button);

        expect(mockProps.onClose).toHaveBeenCalled();
    });
});
