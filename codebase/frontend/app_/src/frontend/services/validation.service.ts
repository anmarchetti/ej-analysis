import dayjs from 'dayjs';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { addDays, isValidDate } from 'frontend/utils/date.utils';
import { getCardType } from 'frontend/utils/payment.utls';
import { getValidatorRule, luhnValidation } from 'frontend/utils/validation.utils';
import { IValidationError } from 'models/data/validation/IValidationError';
import {
    IValidationRulesWithDictionary,
    IValidationRulesWithRawText,
    TValidationRules,
} from 'models/data/validation/IValidationRules';
import { CardType } from 'models/enum/CardType';
import { FileType } from 'models/enum/FileType';
import { ValidationRule } from 'models/enum/ValidationRule';
import { ValidationType } from 'models/enum/ValidationType';

export class ValidationService {
    static buildError(
        errorMessage: string,
        rawErrorMessage: string,
        trigger: ValidationType,
        propertyName?: string,
        rule?: ValidationRule,
        replacedToken?: Tokens,
        replacedValue?: string,
    ): IValidationError {
        return {
            errorMessage,
            rawErrorMessage,
            trigger,
            propertyName,
            rule,
            replacedToken,
            replacedValue,
        } as IValidationError;
    }

    private readonly validationFunctions = {
        [ValidationRule.Required]: this.validateRequired,
        [ValidationRule.MaxLength]: this.validateMaxLength,
        [ValidationRule.MinLength]: this.validateMinLength,
        [ValidationRule.Pattern]: this.validateRegExp,
        [ValidationRule.CardNumber]: this.validateCardNumber,
        [ValidationRule.PaymentMethod]: this.validateCardType,
        [ValidationRule.ConstLength]: this.validateConstLength,
        [ValidationRule.ExpiryDate]: this.validateExpiryDate,
        [ValidationRule.Date]: this.validateDate,
        [ValidationRule.TomorrowDate]: this.isDateInFuture,
        [ValidationRule.ReversePattern]: this.validateReverseRegExp,
        [ValidationRule.MaxLengthPhone]: this.validateMaxPhoneLength,
        [ValidationRule.MaxValue]: this.validateMaxValue,
        [ValidationRule.MinValue]: this.validateMinValue,
        [ValidationRule.FileSize]: this.validateFilesSize,
        [ValidationRule.FileType]: this.validateFilesType,
        [ValidationRule.FilesAmount]: this.validateFilesAmount,
        [ValidationRule.ProhibitedWords]: this.validateProhibitedWords,
    };

    validateField(target: AnyObject, fieldName: string, validationRules?: TValidationRules[]): IValidationError[] {
        /** Get property metadata. */
        const pattern = validationRules || getValidatorRule(target, fieldName);
        const result = [] as IValidationError[];

        if (pattern?.length) {
            (pattern || []).forEach(rule => {
                const validationFunc = this.validationFunctions[rule.type];
                let val = rule.value;

                if (typeof rule.value === 'function') {
                    val = rule.value(target);
                }

                if (validationFunc && !validationFunc(target[fieldName] as any, val as any, rule.strict)) {
                    result.push(
                        ValidationService.buildError(
                            (rule as IValidationRulesWithDictionary).message ?? '',
                            (rule as IValidationRulesWithRawText).rawMessage ?? '',
                            rule.trigger,
                            fieldName as string,
                            rule.type,
                            rule?.replacedToken,
                            rule.replacedValue,
                        ),
                    );
                }
            });
        }

        return result;
    }

    validateModel(target: AnyObject, propertyToIgnore: string[] = []): IValidationError[] {
        const ignores = propertyToIgnore || [];

        return Object.keys(target)
            .map(key => (ignores.indexOf(key) < 0 ? this.validateField(target, key) : []))
            .reduce((a, b) => a.concat(b), [] as IValidationError[]);
    }

    isFieldRequired(target: AnyObject, fieldName: string): boolean {
        const rules = getValidatorRule(target, fieldName);

        return rules?.some(rule => rule.type === ValidationRule.Required);
    }

    /**
     * Value should be gt then @maxLength param
     * @param value verifiable value
     * @param maxLength length to check
     */
    private validateMaxLength(value: string, maxLength: string) {
        return !value || value.length <= +maxLength;
    }

    /**
     * Value should be gt then @maxLength param
     * @param value verifiable value
     * @param maxLength length to check
     */
    private validateMaxPhoneLength(value: string, maxLength: string) {
        return !value || value.replace(/[^0-9]/g, '').length <= +maxLength;
    }

    /**
     * Value should be less then @minLength param
     * @param value - verifiable value
     * @param minLength - length to check
     */
    private validateMinLength(value: string, minLength: string) {
        /** If field is empty, do not need validation */
        if (!value) {
            return true;
        }

        return value.length >= +minLength;
    }

    /**
     * Requeued field.
     * @param value - verifiable value
     * @param isNumber - if value is number then value should be gt then -1
     */
    protected validateRequired(value: string | boolean | any[], isNumber?: boolean, strict: boolean = true): boolean {
        if (isNumber) {
            return +value > -1;
        } else if (!!value && typeof value === 'string' && strict) {
            // validate trimmed value if it's strict required
            value = value.trimLeft();
        }

        return !!value;
    }

    /**
     * Test value on regExp.
     * @param value verifiable value
     * @param regExp regular expression
     */
    private validateRegExp(value: string, regExp: string, strict?: boolean) {
        /** If field is empty, do not need validation */
        if (!value) {
            return true;
        }

        if (strict) {
            // ensure that the whole provided string was validated
            const result = value.match(new RegExp(regExp));

            return !!(result?.length && result[0] === value);
        }

        return new RegExp(regExp).test(value);
    }

    /**
     * Test value on regExp and reverse.
     * @param value verifiable value
     * @param regExp regular expression
     */
    private validateReverseRegExp(value: string, regExp: string) {
        /** If field is empty, do not need validation */
        if (!value) {
            return true;
        }

        return !new RegExp(regExp).test(value);
    }

    /**
     * Check if card number is valid.
     * @param value verifiable value
     */
    private validateCardNumber(value: string) {
        if (!value) {
            return true;
        }

        const noSpaces = value.replace(/ |-/g, '');

        return luhnValidation(noSpaces) && noSpaces.length > 13 && noSpaces.length < 19;
    }

    /**
     * Return true if card type is one of available card types
     * @param card card number
     */
    private validateCardType(card: string) {
        /** If field is empty, do not need validation */
        if (!card) {
            return true;
        }

        return getCardType(card) !== CardType.InvalidType;
    }

    /**
     * Return true if value length eq to @param constLength
     * @param value value to validate
     * @param constLength length to check
     */
    private validateConstLength(value: string, constLength: number) {
        /** If field is empty, do not need validation */
        if (!value) {
            return true;
        }

        return value.length === constLength;
    }

    private validateExpiryDate(value: string) {
        /** If field is empty, do not need validation */
        if (!value) {
            return true;
        }

        const month = parseInt(value.substring(0, 2));
        const year = parseInt(value.substring(3, 5)) + 2000;
        const date = new Date(year, month);

        return date > new Date() && month <= 12;
    }

    private validateDate(value: string, format: string = DATE_FORMATS.inputField) {
        /** If field is empty, do not need validation */
        if (!value) {
            return true;
        }

        return isValidDate(value, format);
    }

    private isDateInFuture(value: string, format: string = DATE_FORMATS.inputField) {
        /** If field is empty, do not need validation */
        if (!value) {
            return true;
        }

        const date = dayjs(value, format, true).toDate();
        const minAllowedDate = addDays(1);

        date.setHours(0, 0, 1);
        minAllowedDate.setHours(0, 0, 0);

        return date >= minAllowedDate;
    }

    private validateMaxValue(value: string, maxValue: number) {
        /** If field is empty, do not need validation */
        if (!value) {
            return true;
        }

        return Number.parseFloat(value) <= maxValue;
    }

    private validateMinValue(value: string, minValue: number) {
        /** If field is empty, do not need validation */
        if (value === '' || value === undefined || value === null) {
            return true;
        }

        return Number.parseFloat(value) > minValue;
    }

    private validateFilesSize(files: Nullable<File[]>, maxFileSize: number) {
        if (!files?.length) {
            return true;
        }

        const filesSum = files.reduce((a, file) => a + file.size, 0);

        return filesSum <= maxFileSize;
    }

    private validateFilesType(files: Nullable<File[]>, types: FileType[]) {
        if (!files?.length) {
            return true;
        }

        return files.every(file => types.includes(file.type as FileType));
    }

    private validateFilesAmount(files: Nullable<File[]>, maxFileAmount: number) {
        if (!files?.length) {
            return true;
        }

        return files?.length <= maxFileAmount;
    }

    /** Validate if the value is the one of prohibited words. */
    private validateProhibitedWords(value: string, prohibitedWords: string[]) {
        // No need to validate if field is empty or no prohibited words
        if (!value || !prohibitedWords.length) return true;

        const isProhibitedWord = prohibitedWords.includes(value);

        return !isProhibitedWord;
    }
}

export default new ValidationService();
