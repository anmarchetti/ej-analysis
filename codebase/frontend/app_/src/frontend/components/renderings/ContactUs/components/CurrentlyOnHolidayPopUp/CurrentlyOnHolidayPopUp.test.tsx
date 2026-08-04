import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import * as uiUtils from 'frontend/utils/ui.utils';

import CurrentlyOnHolidayPopUp, { IOnHolidayProps } from './CurrentlyOnHolidayPopUp';

const mockPopup = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, footerContent, title, ...rest }) => {
        mockPopup({ children, footerContent, title, ...rest });

        return (
            <div data-tid='popup'>
                {children}
                {footerContent}
                {title}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: () => <div data-tid='rich-text-with-links' />,
}));

const mockRouterLinkComponent = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockRouterLinkComponent(props);

        return <button data-tid='router-link' onClick={props.onClick} />;
    },
}));

const createProps = (): IOnHolidayProps => ({
    closeOnHolidayPopup: jest.fn(),
    onHolidayContent: {
        OnHolidayButton: mockSitecoreField(mockSitecoreLinkField('OnHolidayButton')),
        OnHolidayDescription: mockSitecoreField('OnHolidayDescription'),
        OnHolidayTitle: mockSitecoreField('OnHolidayTitle'),
    },
});

const mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockProps;

describe('CurrentlyOnHolidayPopUp', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render the popup with title, description, and buttons', () => {
        render(<CurrentlyOnHolidayPopUp {...mockProps} />);

        expect(screen.getByTestId('on-holiday-title')).toHaveTextContent('OnHolidayTitle');
        expect(mockPopup).toHaveBeenCalledWith({
            children: expect.any(Array),
            containerClass: 'onHolidayPopup',
            footerContent: expect.any(Object),
            id: 'onholiday-popup',
            isContentCentered: true,
            dialogClass: 'onHolidayPopupDialog',
            footerClass: 'onHolidayPopupFooter',
        });
        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(screen.getByTestId('close-on-holiday-popup')).toBeInTheDocument();
    });

    it('should call closeOnHolidayPopup when the close button is clicked', async () => {
        render(<CurrentlyOnHolidayPopUp {...mockProps} />);
        const closeButton = screen.getByTestId('close-on-holiday-popup');

        await userEvent.click(closeButton);

        expect(mockProps.closeOnHolidayPopup).toHaveBeenCalled();
    });

    it('should render the RouterLink button with correct href and text', () => {
        render(<CurrentlyOnHolidayPopUp {...mockProps} />);
        expect(mockRouterLinkComponent).toHaveBeenCalledWith({
            className: 'btn button',
            dataId: 'on-holiday-button',
            link: mockProps.onHolidayContent.OnHolidayButton,
            onClick: expect.any(Function),
        });
    });

    it('should call unLockBodyScroll when the RouterLink button is clicked', async () => {
        const mockUnLockBodyScroll = jest.spyOn(uiUtils, 'unLockBodyScroll');

        render(<CurrentlyOnHolidayPopUp {...mockProps} />);
        const routerLinkButton = screen.getByTestId('router-link');

        await userEvent.click(routerLinkButton);

        expect(mockUnLockBodyScroll).toHaveBeenCalled();
    });

    it('should NOT render RouterLink button if OnHolidayButton is missing', () => {
        mockProps.onHolidayContent.OnHolidayButton = null;
        render(<CurrentlyOnHolidayPopUp {...mockProps} />);
        expect(mockRouterLinkComponent).not.toHaveBeenCalled();
    });
});
