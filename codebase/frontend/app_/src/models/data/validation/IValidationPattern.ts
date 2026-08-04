import { ValidationType } from 'models/enum/ValidationType';

import { TValidationRules } from './IValidationRules';

export interface IValidationPattern {
    rules: TValidationRules[];
    type: ValidationType;
}
