import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface IQuestionAnswerFields {
    Answer: ISitecoreField<string>;
    Question: ISitecoreField<string>;
}

export interface IQuestionAnswerSitecoreItem extends ISitecoreComponent<IQuestionAnswerFields> {
    id: string;
}
