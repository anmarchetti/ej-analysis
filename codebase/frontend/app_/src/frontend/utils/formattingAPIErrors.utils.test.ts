import { CurrencyCode } from 'code/currency';
import { getFormattedValidationErrors } from 'frontend/utils/formattingAPIErrors.utils';
import { IApiInnerError } from 'models/data/ApiErrorData';

describe('formattingAPIErrors', () => {
    const formatMoneyMock = jest.fn(price => `£${price}`);

    describe.each([
        [
            [{ message: 'expired or not valid at the current time', code: 'code' }],
            [{ message: 'expired or not valid at the current time', code: 'code' }],
        ],
        [
            [
                {
                    message: 'only valid for holidays with departure date between 01/01/2022 - 31/10/2023',
                    code: 'code',
                },
            ],
            [
                {
                    message: 'only valid for holidays with departure date between 01/01/2022 - 31/10/2023',
                    code: 'code',
                },
            ],
        ],
        [
            [{ message: 'only valid for holidays from £100', code: 'code' }],
            [{ message: 'only valid for holidays from £100', code: 'code' }],
        ],
        [
            [{ message: 'only valid for holidays from {500.2}', code: 'code' }],
            [{ message: 'only valid for holidays from £500.2', code: 'code' }],
        ],
        [
            [{ message: 'only valid for holidays from {500.222}', code: 'code' }],
            [{ message: 'only valid for holidays from £500.222', code: 'code' }],
        ],
        [
            [{ message: 'only valid for holidays from {700}', code: 'code' }],
            [{ message: 'only valid for holidays from £700', code: 'code' }],
        ],
        [
            [{ message: 'only valid for holidays from {700} to {1000}', code: 'code' }],
            [{ message: 'only valid for holidays from £700 to £1000', code: 'code' }],
        ],
        [
            [{ message: 'only valid for holidays from {500', code: 'code' }],
            [{ message: 'only valid for holidays from {500', code: 'code' }],
        ],
        [
            [{ message: 'only valid for holidays from {test', code: 'code' }],
            [{ message: 'only valid for holidays from {test', code: 'code' }],
        ],
        [
            [{ message: 'only valid for holidays from test}', code: 'code' }],
            [{ message: 'only valid for holidays from test}', code: 'code' }],
        ],
        [
            [{ message: 'only valid for holidays from 500}', code: 'code' }],
            [{ message: 'only valid for holidays from 500}', code: 'code' }],
        ],
        [
            [{ message: 'only valid for holidays from {0.5}', code: 'code' }],
            [{ message: 'only valid for holidays from £0.5', code: 'code' }],
        ],
        [
            [{ message: 'only valid for holidays from {.5}', code: 'code' }],
            [{ message: 'only valid for holidays from {.5}', code: 'code' }],
        ],
    ])('should format only price in right format', (errorsList, expected) => {
        it(`should return ${expected[0].message} for ${errorsList[0].message}`, () => {
            const res = getFormattedValidationErrors(errorsList as IApiInnerError[], formatMoneyMock, CurrencyCode.GBP);

            expect(res).toStrictEqual(expected);
        });
    });
});
