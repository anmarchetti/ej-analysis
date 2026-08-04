import { validate } from 'frontend/utils/validation.utils';
import { ValidationRule } from 'models/enum/ValidationRule';
import { ValidationType } from 'models/enum/ValidationType';

import { ValidationService } from './validation.service';

class Test {
    @validate([
        {
            type: ValidationRule.MaxLength,
            message: 'maxLength',
            trigger: ValidationType.OnBlur,
            value: 4,
        },
    ])
    maxLength: string;

    @validate([
        {
            type: ValidationRule.MinLength,
            message: 'minLength',
            trigger: ValidationType.OnBlur,
            value: 4,
        },
    ])
    minLength: string;

    @validate([
        {
            type: ValidationRule.Required,
            message: 'required',
            trigger: ValidationType.OnBlur,
        },
    ])
    required: string;

    @validate([
        {
            type: ValidationRule.Pattern,
            message: 'regExp',
            trigger: ValidationType.OnBlur,
            value: /^\+?[0-9\/]*$/,
        },
    ])
    regExp: string;

    @validate([
        {
            type: ValidationRule.ReversePattern,
            message: 'reverseRegExp',
            trigger: ValidationType.OnBlur,
            value: /[0-9]/,
        },
    ])
    reverseRegExp: string;

    @validate([
        {
            type: ValidationRule.CardNumber,
            message: 'cardNumber',
            trigger: ValidationType.OnBlur,
        },
    ])
    cardNumber: string;

    @validate([
        {
            type: ValidationRule.PaymentMethod,
            message: 'cardType',
            trigger: ValidationType.OnBlur,
        },
    ])
    cardType: string;

    @validate([
        {
            type: ValidationRule.ConstLength,
            message: 'constLength',
            trigger: ValidationType.OnBlur,
            value: 4,
        },
    ])
    constLength: string;

    @validate([
        {
            type: ValidationRule.ExpiryDate,
            message: 'expiryDate',
            trigger: ValidationType.OnBlur,
        },
    ])
    expiryDate: string;

    @validate([
        {
            type: ValidationRule.Date,
            message: 'dateOfBirth',
            trigger: ValidationType.OnBlur,
            value: 'DD/MM/YYYY',
        },
    ])
    dateOfBirth: string;
}

const service = new ValidationService();
const obj = new Test();

describe('validation.service', () => {
    describe('validateMaxLength', () => {
        test('should return error message if length os more then 4', () => {
            obj.maxLength = '123456';
            const errors = service.validateField(obj, 'maxLength');

            expect(errors).toEqual([
                {
                    errorMessage: 'maxLength',
                    rawErrorMessage: '',
                    propertyName: 'maxLength',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.MaxLength,
                },
            ]);
        });

        test('should return empty array if length is less then 4', () => {
            obj.maxLength = '123';
            const errors = service.validateField(obj, 'maxLength');

            expect(errors).toEqual([]);
        });

        test('should return empty array if value not defined', () => {
            obj.maxLength = '';
            const errors = service.validateField(obj, 'maxLength');

            expect(errors).toEqual([]);
        });
    });

    describe('validateMinLength', () => {
        test('should return error message if length is less then 4', () => {
            obj.minLength = '123';
            const errors = service.validateField(obj, 'minLength');

            expect(errors).toEqual([
                {
                    errorMessage: 'minLength',
                    rawErrorMessage: '',
                    propertyName: 'minLength',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.MinLength,
                },
            ]);
        });

        test('should return empty array if length is more then 4', () => {
            obj.minLength = '1232344';
            const errors = service.validateField(obj, 'minLength');

            expect(errors).toEqual([]);
        });

        test('should return empty array if value not defined', () => {
            obj.minLength = '';
            const errors = service.validateField(obj, 'minLength');

            expect(errors).toEqual([]);
        });
    });

    describe('validateRequired', () => {
        test('should return error message if value not defined', () => {
            obj.required = '';
            const errors = service.validateField(obj, 'required');

            expect(errors).toEqual([
                {
                    errorMessage: 'required',
                    rawErrorMessage: '',
                    propertyName: 'required',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.Required,
                },
            ]);
        });

        test('should return error message if value not defined', () => {
            obj.required = undefined as any;
            const errors = service.validateField(obj, 'required');

            expect(errors).toEqual([
                {
                    errorMessage: 'required',
                    rawErrorMessage: '',
                    propertyName: 'required',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.Required,
                },
            ]);
        });

        test('should return error message if value not defined', () => {
            obj.required = null as any;
            const errors = service.validateField(obj, 'required');

            expect(errors).toEqual([
                {
                    errorMessage: 'required',
                    rawErrorMessage: '',
                    propertyName: 'required',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.Required,
                },
            ]);
        });

        test('should return empty array if value defined', () => {
            obj.required = '1232344';
            const errors = service.validateField(obj, 'required');

            expect(errors).toEqual([]);
        });
    });

    describe('validateRegExp', () => {
        test('should return error message field contains incorrect values', () => {
            obj.regExp = '1as23';
            const errors = service.validateField(obj, 'regExp');

            expect(errors).toEqual([
                {
                    errorMessage: 'regExp',
                    rawErrorMessage: '',
                    propertyName: 'regExp',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.Pattern,
                },
            ]);
        });

        test('should return empty array if field contains correct values', () => {
            obj.regExp = '1232344';
            const errors = service.validateField(obj, 'regExp');

            expect(errors).toEqual([]);
        });

        test('should return empty array if value not defined', () => {
            obj.regExp = '';
            const errors = service.validateField(obj, 'regExp');

            expect(errors).toEqual([]);
        });
    });

    describe('validateReverseRegExp', () => {
        test('should return error message field contains incorrect values', () => {
            obj.reverseRegExp = '1as23';
            const errors = service.validateField(obj, 'reverseRegExp');

            expect(errors).toEqual([
                {
                    errorMessage: 'reverseRegExp',
                    rawErrorMessage: '',
                    propertyName: 'reverseRegExp',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.ReversePattern,
                },
            ]);
        });

        test('should return empty array if field contains correct values', () => {
            obj.reverseRegExp = 'aaaaaaaaa';
            const errors = service.validateField(obj, 'reverseRegExp');

            expect(errors).toEqual([]);
        });

        test('should return empty array if value not defined', () => {
            obj.reverseRegExp = '';
            const errors = service.validateField(obj, 'reverseRegExp');

            expect(errors).toEqual([]);
        });
    });

    describe('validateCardNumber', () => {
        test('should return error message if card number is invalid', () => {
            obj.cardNumber = '344238716403664';
            const errors = service.validateField(obj, 'cardNumber');

            expect(errors).toEqual([
                {
                    errorMessage: 'cardNumber',
                    rawErrorMessage: '',
                    propertyName: 'cardNumber',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.CardNumber,
                },
            ]);
        });

        test('should return empty array if card number is valid', () => {
            obj.cardNumber = '344238716403663';
            const errors = service.validateField(obj, 'cardNumber');

            expect(errors).toEqual([]);
        });

        test('should return empty array if value not defined', () => {
            obj.cardNumber = '';
            const errors = service.validateField(obj, 'cardNumber');

            expect(errors).toEqual([]);
        });
    });

    describe('validateCardType', () => {
        test('should return error message if invalid card type', () => {
            obj.cardType = '144238716403664';
            const errors = service.validateField(obj, 'cardType');

            expect(errors).toEqual([
                {
                    errorMessage: 'cardType',
                    rawErrorMessage: '',
                    propertyName: 'cardType',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.PaymentMethod,
                },
            ]);
        });

        test('should return empty array if card number is valid', () => {
            obj.cardType = '344238716403663';
            const errors = service.validateField(obj, 'cardType');

            expect(errors).toEqual([]);
        });

        test('should return empty array if value not defined', () => {
            obj.cardType = '';
            const errors = service.validateField(obj, 'cardType');

            expect(errors).toEqual([]);
        });
    });

    describe('validateConstLength', () => {
        test('should return error message if invalid value length', () => {
            obj.constLength = '1234444';
            const errors = service.validateField(obj, 'constLength');

            expect(errors).toEqual([
                {
                    errorMessage: 'constLength',
                    rawErrorMessage: '',
                    propertyName: 'constLength',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.ConstLength,
                },
            ]);
        });

        test('should return empty array if valid value length', () => {
            obj.constLength = '1234';
            const errors = service.validateField(obj, 'constLength');

            expect(errors).toEqual([]);
        });

        test('should return empty array if value not defined', () => {
            obj.constLength = '';
            const errors = service.validateField(obj, 'constLength');

            expect(errors).toEqual([]);
        });
    });

    describe('validateExpiryDate', () => {
        test('should return error message if date is invalid', () => {
            obj.expiryDate = '1/2';
            const errors = service.validateField(obj, 'expiryDate');

            expect(errors).toEqual([
                {
                    errorMessage: 'expiryDate',
                    rawErrorMessage: '',
                    propertyName: 'expiryDate',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.ExpiryDate,
                },
            ]);
        });

        test('should return error message if date is in past', () => {
            obj.expiryDate = '11/12';
            const errors = service.validateField(obj, 'expiryDate');

            expect(errors).toEqual([
                {
                    errorMessage: 'expiryDate',
                    rawErrorMessage: '',
                    propertyName: 'expiryDate',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.ExpiryDate,
                },
            ]);
        });

        test('should return empty array if card number is valid', () => {
            obj.expiryDate = '11/40';
            const errors = service.validateField(obj, 'expiryDate');

            expect(errors).toEqual([]);
        });

        test('should return empty array if value not defined', () => {
            obj.expiryDate = '';
            const errors = service.validateField(obj, 'expiryDate');

            expect(errors).toEqual([]);
        });
    });

    describe('validateDateOfBirth', () => {
        test('should return error message if date is invalid', () => {
            obj.dateOfBirth = '10/20/2000';
            const errors = service.validateField(obj, 'dateOfBirth');

            expect(errors).toEqual([
                {
                    errorMessage: 'dateOfBirth',
                    rawErrorMessage: '',
                    propertyName: 'dateOfBirth',
                    trigger: ValidationType.OnBlur,
                    rule: ValidationRule.Date,
                },
            ]);
        });

        test('should return empty array if date is empty', () => {
            obj.dateOfBirth = '';
            const errors = service.validateField(obj, 'dateOfBirth');

            expect(errors).toEqual([]);
        });

        test('should return empty array if date is valid', () => {
            obj.dateOfBirth = '10/10/2000';
            const errors = service.validateField(obj, 'dateOfBirth');

            expect(errors).toEqual([]);
        });
    });

    describe('validateProhibitedWords', () => {
        const createRule = (prohibitedWords: string[]) => ({
            type: ValidationRule.ProhibitedWords,
            message: 'Prohibited words are not allowed',
            trigger: ValidationType.OnBlur,
            value: prohibitedWords,
        });

        it('should NOT return error if no value', () => {
            const rule = createRule(['test']);
            const errors = service.validateField({ value: '' }, 'value', [rule]);

            expect(errors).toHaveLength(0);
        });

        it('should NOT return error if no prohibited words', () => {
            const rule = createRule([]);
            const errors = service.validateField({ value: 'test' }, 'value', [rule]);

            expect(errors).toHaveLength(0);
        });

        it('should NOT return error if value is not prohibited', () => {
            const rule = createRule(['test']);
            const errors = service.validateField({ value: '123testABC' }, 'value', [rule]);

            expect(errors).toHaveLength(0);
        });

        it('should return error if value is prohibited', () => {
            const rule = createRule(['word', 'test']);
            const errors = service.validateField({ value: 'test' }, 'value', [rule]);

            expect(errors).toHaveLength(1);
            expect(errors[0]).toHaveProperty('errorMessage', rule.message);
        });

        it('should NOT return error if value is prohibited word, but in different letter case', () => {
            const rule = createRule(['test']);
            const errors = service.validateField({ value: 'Test' }, 'value', [rule]);

            expect(errors).toHaveLength(0);
        });
    });

    describe('validateModel', () => {
        test('should return error message object contains errors', () => {
            const obj1 = new Test();
            obj1.required = '';
            obj1.regExp = 'asdaf';
            obj1.maxLength = '1234566';
            const errors = service.validateModel(obj1);

            expect(errors.length).toBe(3);
        });

        test('should return error message object contains errors without ignore properties', () => {
            const obj1 = new Test();
            obj1.required = '';
            obj1.regExp = 'asdaf';
            obj1.maxLength = '1234566';
            const errors = service.validateModel(obj1, ['required']);

            expect(errors.length).toBe(2);
        });

        test('should return empty array if no errors', () => {
            const obj1 = new Test();
            obj1.maxLength = '132';
            obj1.minLength = 'test1';
            obj1.required = '1';
            obj1.regExp = '132';
            obj1.cardNumber = '344238716403663';
            obj1.cardType = '344238716403663';
            obj1.constLength = '1234';
            obj1.expiryDate = '11/50';
            const errors = service.validateModel(obj1);

            expect(errors.length).toBe(0);
        });
    });
});
