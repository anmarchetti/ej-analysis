import { Tokens } from 'code/tokens';
import { ValidationRule } from 'models/enum/ValidationRule';
import { ValidationType } from 'models/enum/ValidationType';

interface IBaseValidationRules {
    trigger: ValidationType;
    type: ValidationRule;
    replacedToken?: Tokens;
    replacedValue?: string;
    strict?: boolean;
    value?: any;
}

export interface IValidationRulesWithDictionary extends IBaseValidationRules {
    /** message from dictionary */
    message: string;
}

export interface IValidationRulesWithRawText extends IBaseValidationRules {
    /** text message */
    rawMessage: string;
}

export type TValidationRules = IValidationRulesWithRawText | IValidationRulesWithDictionary;
