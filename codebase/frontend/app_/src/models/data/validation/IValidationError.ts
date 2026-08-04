import { Tokens } from 'code/tokens';
import { ValidationRule } from 'models/enum/ValidationRule';
import { ValidationType } from 'models/enum/ValidationType';

export interface IValidationError {
    errorMessage: string;
    trigger: ValidationType;
    propertyName?: string;
    rawErrorMessage?: string;
    replacedToken?: Tokens;
    replacedValue?: string;
    rule?: ValidationRule;
}
