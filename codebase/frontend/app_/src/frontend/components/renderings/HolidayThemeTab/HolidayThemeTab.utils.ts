import { IThemeFields } from 'models/data/IHolidayInspiration';

import { IFormattedThemeFields, ThemeQuestions } from './interfaces';

export const getAvailableAnswers = (
    availableTags: string[] = [],
    fields: IThemeFields | undefined,
): IFormattedThemeFields[] => {
    const allData = [
        {
            subType: ThemeQuestions.Type,
            title: fields?.HolidayTypeQuestions?.value || '',
            answerVariants: fields?.HolidayTypeOptions || [],
        },
        {
            subType: ThemeQuestions.Vibe,
            title: fields?.HolidayVibeQuestions?.value || '',
            answerVariants: fields?.HolidayVibeOptions || [],
        },
        {
            subType: ThemeQuestions.Weather,
            title: fields?.WeatherQuestions?.value || '',
            answerVariants: fields?.WeatherOptions || [],
        },
    ];

    return allData.reduce((acc, questionsData) => {
        const availableAnswers = availableTags?.length
            ? questionsData.answerVariants.filter(
                  variant =>
                      availableTags.includes(variant.fields.Code.value || '') ||
                      questionsData.subType === ThemeQuestions.Weather,
              )
            : questionsData.answerVariants;

        return availableAnswers.length
            ? [
                  ...acc,
                  {
                      ...questionsData,
                      answerVariants: availableAnswers,
                  },
              ]
            : acc;
    }, [] as IFormattedThemeFields[]);
};
