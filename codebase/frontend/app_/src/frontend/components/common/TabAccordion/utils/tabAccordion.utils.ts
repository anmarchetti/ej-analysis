import { IQuestionAnswerSitecoreItem } from 'models/data/IQuestionAnswerFields';
import { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';
import { ICategoriesSitecoreItem } from 'frontend/components/renderings/Help/FAQ';

export const getTabItems = (items: IQuestionAnswerSitecoreItem[]): ITabItem[] =>
    items.map(item => ({
        id: item.id,
        TitleTab: item.fields?.Question,
        ContentTab: item.fields?.Answer,
    }));

export const getFaqTabItems = (items: ICategoriesSitecoreItem[]): ITabItem[] =>
    items.map(item => ({
        id: item.id,
        TitleTab: item.fields?.CategoryTitle,
    }));
