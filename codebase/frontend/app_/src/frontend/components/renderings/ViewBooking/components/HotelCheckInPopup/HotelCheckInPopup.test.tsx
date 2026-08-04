import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import HotelCheckInPopup, { THotelCheckInPopupProps } from './HotelCheckInPopup';

const createProps = (): THotelCheckInPopupProps => ({
    onClose: jest.fn(),
});

let mockProps = createProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockIsMoreThenMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenMobileViewport: () => mockIsMoreThenMobileViewport,
}));

const mockFloatingPopupProps = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: props => {
        mockFloatingPopupProps(props);

        return (
            <div data-tid='floating-popup'>
                {props.children} {props.footerContent}
            </div>
        );
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button data-tid='button' onClick={props.onClick} />;
    },
}));

const mockRichTextProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextProps(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

describe('HotelCheckInPopup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        mockIsMoreThenMobileViewport = true;
    });

    it('should render component', () => {
        render(<HotelCheckInPopup {...mockProps} />);

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(mockFloatingPopupProps).toHaveBeenCalledWith({
            onClose: mockProps.onClose,
            footerContent: expect.anything(),
            id: 'hotel-check-in-popup',
            children: expect.anything(),
            contentClass: 'body',
        });

        expect(screen.getByTestId('hotel-check-in-popup-title')).toHaveTextContent(
            SitecoreDictionary.ViewBookingHotelCheckInPopupTitle,
        );

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockProps.onClose,
            isOutlined: true,
            isFullWidth: false,
            type: 'button',
            'aria-label': SitecoreDictionary.GlobalsButtonsClose,
            dataTid: 'hotel-check-in-popup-close-btn',
            children: SitecoreDictionary.GlobalsButtonsClose,
            className: 'closeBtn',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextProps).toHaveBeenCalledWith({
            dataId: 'hotel-check-in-popup-description',
            className: 'description',
            field: { value: SitecoreDictionary.ViewBookingHotelCheckInPopupDescription },
        });
    });

    it('should render component on mobile', () => {
        mockIsMoreThenMobileViewport = false;
        render(<HotelCheckInPopup {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockProps.onClose,
            isOutlined: true,
            isFullWidth: true,
            type: 'button',
            'aria-label': SitecoreDictionary.GlobalsButtonsClose,
            dataTid: 'hotel-check-in-popup-close-btn',
            children: SitecoreDictionary.GlobalsButtonsClose,
            className: 'closeBtn',
        });
    });
});
