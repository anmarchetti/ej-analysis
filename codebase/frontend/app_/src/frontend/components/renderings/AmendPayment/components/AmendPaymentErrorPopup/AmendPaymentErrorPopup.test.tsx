import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AmendPaymentErrorPopup, { IAmendPaymentErrorPopupProps } from './AmendPaymentErrorPopup';

const createProps = (): IAmendPaymentErrorPopupProps => ({
    fields: {
        PaymentErrorDescription: mockSitecoreField('PaymentErrorDescription'),
        PaymentErrorTitle: mockSitecoreField('PaymentErrorTitle'),
        PaymentErrorCTA: mockSitecoreField('PaymentErrorCTA'),
        PaymentAtcomErrorCTA: mockSitecoreField('PaymentErrorDescription'),
        DatesLabel: mockSitecoreField('DatesLabel'),
        FlightLabel: mockSitecoreField('FlightLabel'),
        RoomAndBoardLabel: mockSitecoreField('RoomAndBoardLabel'),
        SeatsLabel: mockSitecoreField('SeatsLabel'),
        TransferLabel: mockSitecoreField('TransferLabel'),
        HotelLabel: mockSitecoreField('HotelLabel'),
    },
    onClose: jest.fn(),
});

const createStores = () =>
    createMockStores({
        payStore: {
            isAtcomError: false,
        },
        amendPaymentStore: {
            getAmendTransportLabel: jest.fn(v => v),
            insertAmendmentTypeIntoTemplate: jest.fn(v => v),
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

describe('<AmendPaymentErrorPopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should render standard', () => {
        render(<AmendPaymentErrorPopup {...mockProps} />);

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(mockFloatingPopupProps).toHaveBeenCalledWith({
            contentClass: 'popup',
            onClose: mockProps.onClose,
            footerContent: expect.anything(),
            children: expect.anything(),
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields.PaymentErrorDescription,
            className: 'description',
        });

        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields.PaymentErrorTitle,
            className: 'title',
            tag: 'h4',
        });

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockProps.onClose,
            isFullWidth: true,
            'aria-label': mockProps.fields.PaymentErrorCTA.value,
            children: mockProps.fields.PaymentErrorCTA.value,
        });
    });

    it('should render another button label if it was Atcom error ', () => {
        mockStores.payStore.isAtcomError = true;
        render(<AmendPaymentErrorPopup {...mockProps} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockProps.onClose,
            isFullWidth: true,
            'aria-label': mockProps.fields.PaymentAtcomErrorCTA.value,
            children: mockProps.fields.PaymentAtcomErrorCTA.value,
        });
    });
});
