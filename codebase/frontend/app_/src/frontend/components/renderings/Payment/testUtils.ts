import { IPaymentGAParams } from 'models/data/IPaymentInfo';

export const getMockFunctionCallsWithSpecificParam = (mockFn: jest.Mock, parameter: IPaymentGAParams): Array<any[]> =>
    mockFn.mock.calls.filter(([arg]) => arg === parameter);
