import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { refundOptionsFieldsMock } from 'frontend/components/renderings/CancelBooking/__mocks__/mockFields';

import { IRefundOptionPopupProps, RefundOptionPopup } from './RefundOptionPopup';

const createProps = (): IRefundOptionPopupProps => ({
    fields: refundOptionsFieldsMock[0].fields.Popups[0].fields,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isEditMode: false,
        },
        holidayCreditStore: {
            depositPerPassenger: 80,
        },
    });

let mockProps;
let mockStores;

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

const mockPopupNew = jest.fn();
jest.mock('frontend/components/common/Popup/PopupNew', () => ({
    __esModule: true,
    default: ({ children, footerContent, ...restProps }) => {
        mockPopupNew(restProps);

        return (
            <div data-tid='popup-new'>
                {children}
                {footerContent}
            </div>
        );
    },
}));

describe('<RefundOptionPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when IsLinkVisible is false', () => {
        mockProps.fields = refundOptionsFieldsMock[1].fields;

        const { container } = render(<RefundOptionPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render button when IsLinkVisible is true', () => {
        render(<RefundOptionPopup {...mockProps} />);

        expect(screen.getByRole('button', { name: mockProps.fields.LinkText.value })).toHaveClass('link');
        expect(screen.queryByTestId('popup-new')).not.toBeInTheDocument();
    });

    it('should open popup when click on button', async () => {
        render(<RefundOptionPopup {...mockProps} />);

        expect(screen.queryByTestId('popup-new')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button'));

        expect(mockPopupNew).toHaveBeenCalledWith(
            expect.objectContaining({
                dialogClass: 'dialog',
                onClose: expect.any(Function),
            }),
        );
        expect(screen.getByTestId('popup-new')).toBeInTheDocument();
        expect(screen.getByTestId('refund-option-close-btn')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsClose);
        expect(screen.getByText(mockProps.fields.TitlePopup.value)).toHaveClass('title');
    });

    it('should close popup on button click', async () => {
        render(<RefundOptionPopup {...mockProps} />);

        expect(screen.queryByTestId('popup-new')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button'));

        expect(screen.getByTestId('popup-new')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsClose }));

        expect(screen.queryByTestId('popup-new')).not.toBeInTheDocument();
    });

    describe('Popup Text', () => {
        it('should render formatted TextPopup when it is NOT edit mode', async () => {
            const {
                layoutStore: { getPhrase },
                marketStore: { formatMoney, currency },
                holidayCreditStore: { depositPerPassenger },
            } = mockStores;

            render(<RefundOptionPopup {...mockProps} />);
            await userEvent.click(screen.getByRole('button'));

            expect(Tokenizer.replaceToken).toHaveBeenNthCalledWith(
                1,
                getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson),
                Tokens.Price,
                formatMoney(depositPerPassenger, {
                    currency,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                }),
            );
            expect(Tokenizer.replaceToken).toHaveBeenNthCalledWith(
                2,
                mockProps.fields.TextPopup.value,
                Tokens.DepositPricePP,
                'Globals.PriceLabels.PerPerson £80',
            );
            expect(screen.getByText('TextPopup1 Globals.PriceLabels.PerPerson £80')).toBeInTheDocument();
        });

        it('should render pure TextPopup when it is edit mode', async () => {
            mockStores.layoutStore.isEditMode = true;

            render(<RefundOptionPopup {...mockProps} />);
            await userEvent.click(screen.getByRole('button'));

            expect(Tokenizer.replaceToken).not.toHaveBeenCalled();

            expect(screen.getByText(mockProps.fields.TextPopup.value)).toBeInTheDocument();
        });
    });
});
