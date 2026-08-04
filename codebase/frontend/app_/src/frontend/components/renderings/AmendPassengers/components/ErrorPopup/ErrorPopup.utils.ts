import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ApiErrors } from 'models/enum/ApiErrors';

import { IErrorPopupProps, TPassengerErrorTypes } from './ErrorPopup';

interface IDescriptionHandlerOptions {
    charactersChangeCount: string;
}

type TErrorFieldsConfigType = {
    [key in TPassengerErrorTypes]: {
        description: string;
        title: string;
        icon?: string;
    };
};

const ErrorFieldsConfig: TErrorFieldsConfigType = {
    [ApiErrors.ChangeLimitExeeded]: {
        title: 'RestrictionsPopupTitle',
        description: 'ChangeLimitRestriction',
    },
    [ApiErrors.CharactersChangeLimitExeeded]: {
        title: 'RestrictionsPopupTitle',
        description: 'CharacterLimitRestriction',
    },
    LeadPassengerRestriction: {
        title: 'RestrictionsPopupTitle',
        description: 'LeadPassengerRestriction',
    },
    RemovePassengerRestriction: {
        title: 'RestrictionsPopupTitle',
        description: 'RemovePassengerRestriction',
    },
    Generic: {
        icon: 'ErrorPopupIcon',
        title: 'ErrorPopupTitle',
        description: 'ErrorPopupSubtext',
    },
};

export const getErrorPopupMeta = (
    errorType: TPassengerErrorTypes,
    fields: IErrorPopupProps['fields'],
    { charactersChangeCount }: IDescriptionHandlerOptions,
) => {
    const fieldsIndex = ErrorFieldsConfig[errorType];
    const icon = fieldsIndex?.icon ? fields?.[fieldsIndex?.icon] : null;
    const title = fields?.[fieldsIndex?.title];
    const description = fields?.[fieldsIndex?.description];
    const phoneNumber = fields?.Phone?.value;
    const descriptionValue = Tokenizer.replaceTokens(description?.value, {
        [Tokens.Number]: phoneNumber ? `<a class='btn-txt' href='tel:${phoneNumber}'>${phoneNumber}</a>` : '',
        [Tokens.CharactersCount]: charactersChangeCount,
    });

    return {
        title,
        icon,
        description: {
            value: descriptionValue.trim(),
        },
    };
};
