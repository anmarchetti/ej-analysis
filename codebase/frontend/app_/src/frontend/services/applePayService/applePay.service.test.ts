import { ApiError } from 'models/data/ApiError';

import ApplePayService from './applePay.service';

const mockAxiosPost = jest.fn();
const mockAxiosIsCancel = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        post: (...data: any) => mockAxiosPost(...data),
    }),
    isCancel: () => mockAxiosIsCancel(),
}));

window.errorTracking = jest.fn();

describe('ApplePayService', () => {
    it('should receive a 200 response and an Apple Pay Session Object when validateMerchant is called', async () => {
        mockAxiosPost.mockImplementationOnce(() => Promise.resolve({ data: { applePaySessionObject: {} } }));

        const result = await ApplePayService.validateMerchant('testValidationURL');

        expect(mockAxiosPost).toHaveBeenCalledWith(
            'http://test/api/v1.0/payment/apple-pay/session',
            { validationUrl: 'testValidationURL', requestDomain: 'localhost' },
            undefined,
        );
        expect(result).toEqual({ applePaySessionObject: {} });
    });

    it('should catch and throw an error when validateMerchant receives an error', async () => {
        mockAxiosPost.mockImplementationOnce(() => Promise.reject(new Error('testMessage')));

        try {
            await ApplePayService.validateMerchant('testValidationURL');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            expect(e.message).toBe('testMessage');
        }
    });
});
