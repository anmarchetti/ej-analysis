import React from 'react';
import { render, screen } from '@testing-library/react';
import classNames from 'classnames';

import { comparePriceFieldsMock } from 'frontend/__mocks__/comparePrice';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ITab } from 'frontend/components/common/Tabs/Tabs';

import { ComparePriceContent } from './ComparePriceContent';
import type { IComparePriceContentProps } from './ComparePriceContent.utils';
import * as utils from './ComparePriceContent.utils';

jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='drawer'>{children}</div>,
}));

const mockPopupNewComponent = jest.fn();
jest.mock('frontend/components/common/Popup/PopupNew', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockPopupNewComponent(props);

        return <div data-tid='popup-new'>{children()}</div>;
    },
}));

const mockTabsComponent = jest.fn();
jest.mock('frontend/components/common/Tabs/Tabs', () => ({
    __esModule: true,
    default: props => {
        mockTabsComponent(props);

        return <div data-tid='tabs' />;
    },
}));

jest.mock('frontend/components/renderings/ComparePriceModule/components/ComparePriceFooter/ComparePriceFooter', () => ({
    __esModule: true,
    default: () => <div data-tid='footer' />,
}));

const mockBookingAlterationDrawer = jest.fn();
jest.mock('frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer', () => ({
    __esModule: true,
    default: props => {
        mockBookingAlterationDrawer(props);

        return <div data-tid='booking-alteration-drawer' />;
    },
}));

const createProps = (): IComparePriceContentProps => ({
    holidayDuration: 6,
    selectedDate: new Date(),
    onClose: jest.fn(),
    resetSelectedOffer: jest.fn(),
    isResetingSelectedOffer: false,
    fields: comparePriceFieldsMock,
    params: {},
    rendering: {},
});

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));

const preparedData = {
    backButtonText: 'test back button',
    isMobileView: false,
    popupProps: {
        fullWidth: true,
        onClose: jest.fn(),
    },
    tabsProps: {
        tabs: [{}, {}] as ITab[],
        onChange: jest.fn(),
    },
    footerProps: {
        isCancelTransparent: true,
        onCancel: jest.fn(),
        disabled: false,
        isDisabled: false,
        onClick: jest.fn(),
        getPhrase: jest.fn(p => p),
        confirmButtonText: 'confirm',
        isReviewNeeded: true,
    },
    isReviewPopupOpened: true,
    onReviewPopupApply: jest.fn(),
    onReviewPopupClose: jest.fn(),
    freeChildPlaceInfoTitle: mockSitecoreField('test title'),
    freeChildPlaceInfoText: mockSitecoreField('test text'),
    hideFreeChildPlaceInfoBox: false,
    newTotalPrice: 10,
    fallback: 'fallback',
    alterationResults: [],
} as utils.IUseComparePriceContentData;

const useComparePricePreparedData = jest.spyOn(utils, 'default').mockReturnValue(preparedData);

let props;

describe('<ComparPriceContent />', () => {
    beforeEach(() => {
        props = createProps();

        const modalPortal = document.createElement('div');
        modalPortal.setAttribute('id', 'modal-portal-root');

        document.body.appendChild(modalPortal);
    });

    it('should be rendered when both selectedDate and tabsProps are not null', () => {
        render(<ComparePriceContent {...props} />);

        expect(screen.getByTestId('popup-new')).toBeInTheDocument();
        expect(screen.getByTestId('tabs')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
        expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
        expect(screen.getByTestId('booking-alteration-drawer')).toBeInTheDocument();

        expect(mockPopupNewComponent).toHaveBeenCalledWith({
            fullWidth: true,
            onClose: preparedData.popupProps!.onClose,
        });
        expect(mockTabsComponent).toHaveBeenCalledWith({
            containerClass: 'container hidden',
            dataTid: 'popup-tabs',
            onChange: preparedData.tabsProps!.onChange,
            tabs: preparedData.tabsProps!.tabs,
            tabsWrapperClass: 'tabsWrapper',
            tabPanelClass: 'tabContentWrapper',
        });
        expect(mockBookingAlterationDrawer).toHaveBeenCalledWith({
            isOpen: preparedData.isReviewPopupOpened,
            onCancel: expect.any(Function),
            onConfirm: expect.any(Function),
            alterationResults: preparedData.alterationResults,
            hideInfoBlock: preparedData.hideFreeChildPlaceInfoBox,
            price: preparedData.newTotalPrice,
            selectedItemElement: undefined,
            alterationChangingFromBoardTitle: props.fields.ChangingFromBoardLabel,
            alterationChangingFromRoomTitle: props.fields.ChangingFromRoomLabel,
            fallbackImage: preparedData.fallback,
            freeChildPlaceInfoText: preparedData.freeChildPlaceInfoText,
            freeChildPlaceInfoTitle: preparedData.freeChildPlaceInfoTitle,
            isRoomSelection: false,
            subtitle: props.fields.ReviewChangesSubTitle,
            title: props.fields.ReviewChangesTitle.value,
            shouldTrack: false,
            isInDrawer: true,
            isTotalPrice: true,
            backButtonText: preparedData.backButtonText,
            confirmButtonText: props.fields.ApplyWithChangesButtonText.value,
        });
    });

    it('should render BookingAlterationDrawer with empty alterationResults when alterationResults are NOT provided', () => {
        useComparePricePreparedData.mockReturnValueOnce({
            ...preparedData,
            alterationResults: undefined,
        });

        render(<ComparePriceContent {...props} />);

        expect(screen.getByTestId('booking-alteration-drawer')).toBeInTheDocument();
        expect(mockBookingAlterationDrawer).toHaveBeenCalledWith(
            expect.objectContaining({
                alterationResults: [],
            }),
        );
    });

    it('should NOT render BookingAlterationDrawer when isReviewPopupOpened is false', () => {
        preparedData.isReviewPopupOpened = false;

        render(<ComparePriceContent {...props} />);

        expect(screen.queryByTestId('booking-alteration-drawer')).not.toBeInTheDocument();
        expect(mockTabsComponent).toHaveBeenCalledWith({
            containerClass: 'container',
            dataTid: 'popup-tabs',
            onChange: preparedData.tabsProps!.onChange,
            tabs: preparedData.tabsProps!.tabs,
            tabsWrapperClass: 'tabsWrapper',
            tabPanelClass: 'tabContentWrapper',
        });
    });

    it('should NOT render BookingAlterationDrawer when onReviewPopupClose is NOT provided', () => {
        preparedData.onReviewPopupClose = undefined;

        render(<ComparePriceContent {...props} />);

        expect(screen.queryByTestId('booking-alteration-drawer')).not.toBeInTheDocument();
    });

    it('should NOT render BookingAlterationDrawer when onReviewPopupApply is NOT provided', () => {
        preparedData.onReviewPopupApply = undefined;

        render(<ComparePriceContent {...props} />);

        expect(screen.queryByTestId('booking-alteration-drawer')).not.toBeInTheDocument();
    });

    it('should NOT be rendered when selectedDate is null', () => {
        props.selectedDate = null;

        const { container } = render(<ComparePriceContent {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT be rendered when tabsProps is undefined', () => {
        useComparePricePreparedData.mockReturnValueOnce({
            ...preparedData,
            tabsProps: undefined,
        });

        const { container } = render(<ComparePriceContent {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render drawer when isMobileView is true', () => {
        useComparePricePreparedData.mockReturnValueOnce({
            ...preparedData,
            isMobileView: true,
        });

        render(<ComparePriceContent {...props} />);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(screen.getByTestId('tabs')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
        expect(screen.queryByTestId('popup-new')).not.toBeInTheDocument();

        expect(mockPopupNewComponent).not.toHaveBeenCalled();
        expect(mockTabsComponent).toHaveBeenCalledWith({
            containerClass: classNames('container mobile'),
            dataTid: 'popup-tabs',
            onChange: preparedData.tabsProps!.onChange,
            tabs: preparedData.tabsProps!.tabs,
            tabsWrapperClass: 'tabsWrapper',
            tabPanelClass: 'tabContentWrapper',
        });
    });
});
