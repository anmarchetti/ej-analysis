import { action, makeObservable, observable } from 'mobx';

import { FeedbackFormValidationConfig, getFeedbackDocsValidationConfig } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import { validate } from 'frontend/utils/validation.utils';
import { FileType } from 'models/enum/FileType';

import { IValidationError } from './validation/IValidationError';

export enum FeedbackFormInfoFields {
    Name = 'Name',
    TradeAgentName = 'TradeAgentName',
    ABTANumber = 'ABTANumber',
    Email = 'Email',
    IsWebsiteRelated = 'IsWebsiteRelated',
    IsTradeFeedback = 'IsTradeFeedback',
    IsOtherFeedback = 'IsOtherFeedback',
    FeedbackText = 'FeedbackText',
    Documents = 'Documents',
    IsFeedbackTypeValid = 'IsFeedbackTypeValid',
}

type TFeedbackFormInfoProps = {
    fileErrorLabel: string;
    fileTypes: FileType[];
    maxFileCount: number;
    maxFileSize: number;
};

export class FeedbackFormInfo {
    @validate(FeedbackFormValidationConfig.Name) @observable Name: string = '';
    @validate(FeedbackFormValidationConfig.TradeAgentName) @observable TradeAgentName: string = '';
    @validate(FeedbackFormValidationConfig.ABTANumber) @observable ABTANumber: string = '';
    @validate(FeedbackFormValidationConfig.Email) @observable Email: string = '';
    @validate(FeedbackFormValidationConfig.FeedbackText) @observable FeedbackText: string = '';
    @observable Documents: Nullable<File[]> = null;

    @observable IsWebsiteRelated: boolean = false;
    @observable IsTradeFeedback: boolean = false;
    @observable IsOtherFeedback: boolean = false;

    @validate(FeedbackFormValidationConfig.IsFeedbackTypeValid) @observable IsFeedbackTypeValid: boolean = false;

    constructor(props: TFeedbackFormInfoProps) {
        makeObservable(this);

        const docsValidationRules = getFeedbackDocsValidationConfig(props);

        validate(docsValidationRules)(this, 'Documents');
    }

    get isValid(): boolean {
        const errors = validationService.validateModel(this);

        return errors.length === 0;
    }

    validateField = (field: FeedbackFormInfoFields): IValidationError[] =>
        validationService.validateField(this, field as keyof FeedbackFormInfo);

    @action onChangeField = (field: FeedbackFormInfoFields, value: string | boolean | Nullable<File[]>): void => {
        this[field as string] = value;
    };
}
