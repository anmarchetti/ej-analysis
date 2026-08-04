import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IHolidaysStores } from 'frontend/store/holidays';

import ApplePayError from './ApplePayError';

const createStore = (error?: any): IHolidaysStores =>
    createMockStores({
        payStore: {
            applePayValidationError: error,
        },
        layoutStore: {
            getPhrase: (key: string) => key,
        },
    });

let mockStores: IHolidaysStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('ApplePayError', () => {
    it('should render the error when applePayValidationError is set', () => {
        const mockError = {
            descriptionKey: 'Payment.FailureMessages.ApplePayMerchantValidation',
            code: 'apple_merchant_validation_failed',
        };

        mockStores = createStore(mockError);
        render(<ApplePayError />);

        expect(screen.getByText(mockError.descriptionKey)).toBeInTheDocument();
    });

    it('should NOT render component when applePayValidationError is undefined', () => {
        mockStores = createStore(undefined);
        const { container } = render(<ApplePayError />);

        expect(container).toBeEmptyDOMElement();
    });
});
