import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { ApiErrors } from 'models/enum/ApiErrors';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import {
    validationErrorOnBlurMock,
    validationErrorOnTypeMock,
} from 'frontend/components/renderings/PromocodeInput/__mocks__/promocodeInput.mocks';

import PromocodeErrors, { IPromocodeErrorsProps } from './PromocodeErrors';

jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: ({ dictionaryKey }) => <div data-tid='rich-text-dictionary'>{dictionaryKey}</div>,
}));

const createProps = (): IPromocodeErrorsProps => ({ errorText: 'errorText' });
const createStores = () =>
    createMockStores({
        bookingStore: {
            promoCode: {
                promocodeErrorCode: ApiErrors.PromocodeValidation,
                promocodeValidationErrors: [validationErrorOnBlurMock, validationErrorOnTypeMock],
            },
        },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PromocodeErrors />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render promo error', () => {
        render(<PromocodeErrors {...mockProps} />);

        expect(screen.getByTestId('promocode-error-container')).toHaveClass('error form-control__error is-fullwidth');
        expect(screen.getByTestId('promocode-error-icon')).toHaveClass(
            'errorIcon form-control__error__icon form-control__error__icon__multiple',
        );
        expect(screen.getByTestId('promocode-error-multiple')).toHaveClass(
            'multipleError form-control__error__multiple',
        );

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.HolidaysPromotionCriteriaErrorsMultipleErrors,
        );
        expect(screen.getByText(validationErrorOnBlurMock.errorMessage)).toBeInTheDocument();
        expect(screen.getByText(validationErrorOnTypeMock.errorMessage)).toBeInTheDocument();

        expect(screen.queryByTestId('rich-text-dictionary')).not.toBeInTheDocument();
        expect(screen.queryByText(mockProps.errorText)).not.toBeInTheDocument();
    });

    it('should render voucher error', () => {
        mockStores.bookingStore.promoCode.promocodeErrorCode = ApiErrors.VoucherExpired;

        render(<PromocodeErrors {...mockProps} />);

        expect(screen.getByTestId('promocode-error-container')).toHaveClass(
            'error form-control__error is-fullwidth voucherValidationError',
        );
        expect(screen.getByTestId('promocode-error-icon')).toHaveClass('errorIcon form-control__error__icon');
        expect(screen.queryByTestId('promocode-error-multiple')).not.toBeInTheDocument();
        expect(mockStores.layoutStore.getPhrase).not.toHaveBeenCalled();
        expect(screen.getByTestId('rich-text-dictionary')).toHaveTextContent(validationErrorOnBlurMock.errorMessage);
        expect(screen.queryByText(mockProps.errorText)).not.toBeInTheDocument();
    });

    it('should render plain error', () => {
        mockStores.bookingStore.promoCode.promocodeErrorCode = ApiErrors.WrongDiscount;

        render(<PromocodeErrors {...mockProps} />);

        expect(screen.getByTestId('promocode-error-container')).toHaveClass('error form-control__error is-fullwidth');
        expect(screen.getByTestId('promocode-error-icon')).toHaveClass('errorIcon form-control__error__icon');
        expect(screen.queryByTestId('promocode-error-multiple')).not.toBeInTheDocument();
        expect(mockStores.layoutStore.getPhrase).not.toHaveBeenCalled();
        expect(screen.queryByTestId('rich-text-dictionary')).not.toBeInTheDocument();
        expect(screen.getByText(mockProps.errorText)).toHaveClass('errorLabel form-control__error__label');
    });
});
