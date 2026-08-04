import { IQuestionSitecoreData, TQuestionsTitle, TQuizTabData } from 'models/data/IHolidayInspiration';

export const getInitialQuestions = (QuestionsData: IQuestionSitecoreData[]): TQuizTabData[] =>
    QuestionsData.reduce((acc, item) => {
        if (!item.props.rendering.dataSource) {
            return acc;
        }

        return [
            ...acc,
            {
                title: item.props.rendering.componentName as TQuestionsTitle,
                answer: null,
                isShownOnProgressBar: !item.props.rendering.params.ExcludedFromProgressBar,
                progressBarTitle:
                    item.props.rendering.fields?.ProgressBarTitle?.value ??
                    item.props.rendering.fields?.data?.ProgressBarTitle?.value ??
                    '',
            },
        ];
    }, []);
