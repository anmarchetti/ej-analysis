import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import WhenFieldButtons, { IWhenFieldButtonsProps } from './WhenFieldButtons';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Button', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        default: forwardRef((props, ref) => (
            <button data-tid={props.dataTid} onClick={props.onClick} ref={ref} className={props.className}>
                {props.children}
            </button>
        )),
    };
});

jest.mock('frontend/hooks/useMediaQuery');

const createProps = (): IWhenFieldButtonsProps => ({
    nightsNum: 1,
    nightsSelectedLabel: 'nightsSelectedLabel',
    value: [new Date()],
    clearDate: jest.fn(),
    onApply: jest.fn(),
    onCloseClick: jest.fn(),
    applyBtnText: 'apply',
    isApplyDisabled: false,
    ignoreIsPromoPage: false,
});

const createStores = () =>
    createMockStores({
        layoutStore: { isPromoPage: false },
        searchStore: { setSeachPerformWithNewParams: jest.fn() },
    });

let mockProps;
let mockStores;

describe('<WhenFieldButtons />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.mocked(useMobileViewport).mockReturnValue(true);
    });

    it('should call clearDate when click on clear button', async () => {
        mockProps.value = [];
        render(<WhenFieldButtons {...mockProps} />);

        await userEvent.click(screen.getByTestId('clear-selection'));

        expect(mockProps.clearDate).toHaveBeenCalled();
    });

    it('should render clear button when from date is selected', () => {
        render(<WhenFieldButtons {...mockProps} />);

        expect(screen.getByTestId('clear-selection')).toHaveClass('shown');
    });

    it('should NOT render clear button when from date is not selected', () => {
        mockProps.value = [];
        render(<WhenFieldButtons {...mockProps} />);

        expect(screen.getByTestId('clear-selection')).not.toHaveClass('shown');
    });

    it('should render nightsSelectedLabel when nightsNum > 0', () => {
        render(<WhenFieldButtons {...mockProps} />);

        expect(screen.getByText('nightsSelectedLabel')).toHaveClass('shown');
    });

    it('should NOT render nightsSelectedLabel message when nightsNum = 0', () => {
        mockProps.nightsNum = 0;
        render(<WhenFieldButtons {...mockProps} />);

        expect(screen.queryByText('nightsSelectedLabel')).not.toHaveClass('shown');
    });

    it('should render close selection button', () => {
        render(<WhenFieldButtons {...mockProps} />);

        expect(screen.getByTestId('close-selection')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsClose);
    });

    it('should render button with applyBtnText message when applyBtnText field is provided', () => {
        render(<WhenFieldButtons {...mockProps} />);

        expect(screen.getByTestId('apply-selection')).toHaveTextContent('apply');
    });

    it('should render button with GlobalsButtonsApply message when no applyBtnText field is provided', () => {
        mockProps.applyBtnText = null;
        render(<WhenFieldButtons {...mockProps} />);

        expect(screen.getByTestId('apply-selection')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsApply);
    });

    it('should invoke renderError on mobile', () => {
        const errorTextMessage = 'no dates selected';
        mockProps.renderError = jest.fn(() => <div>{errorTextMessage}</div>);

        render(<WhenFieldButtons {...mockProps} />);

        expect(screen.getByText(errorTextMessage)).toBeInTheDocument();
    });

    describe('Apply', () => {
        it('should call apply after click apply when date range is selected', async () => {
            mockProps.value = [new Date(), new Date()];
            render(<WhenFieldButtons {...mockProps} />);

            await userEvent.click(screen.getByTestId('apply-selection'));

            expect(mockProps.onApply).toHaveBeenCalled();
        });

        it('should call setSearchPerformWithNewParams after click apply on promo page when ignoreIsPromoPage is false', async () => {
            mockStores.layoutStore.isPromoPage = true;
            mockProps.value = [new Date(), new Date()];
            render(<WhenFieldButtons {...mockProps} />);

            await userEvent.click(screen.getByTestId('apply-selection'));

            expect(mockStores.searchStore.setSeachPerformWithNewParams).toHaveBeenCalled();
        });

        it('should not call setSearchPerformWithNewParams after click apply on promo page when ignoreIsPromoPage is true', async () => {
            mockStores.layoutStore.isPromoPage = true;
            mockProps.ignoreIsPromoPage = true;
            render(<WhenFieldButtons {...mockProps} />);

            await userEvent.click(screen.getByTestId('apply-selection'));

            expect(mockStores.searchStore.setSeachPerformWithNewParams).not.toHaveBeenCalled();
        });

        it('should call apply when date range is not selected and apply is disabled', async () => {
            mockProps.isApplyDisabled = true;
            render(<WhenFieldButtons {...mockProps} />);

            await userEvent.click(screen.getByTestId('apply-selection'));

            expect(mockProps.onApply).toHaveBeenCalled();
        });
    });
});
