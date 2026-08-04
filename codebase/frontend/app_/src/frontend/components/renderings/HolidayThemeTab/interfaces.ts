import { ITagOption, IThemeFields } from 'models/data/IHolidayInspiration';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

export type THolidayThemeProps = ISitecoreComponent<IThemeFields>;

export interface IThemeAnswerData {
    answer: string;
    goalId: string;
    isActive: boolean;
}

export type TThemeAnswers = {
    [key in ThemeQuestions]: IThemeAnswerData;
};

export interface IFormattedThemeFields {
    answerVariants: ITagOption[];
    subType: ThemeQuestions;
    title: string;
}

export enum ThemeQuestions {
    Type = 'typeQuestions',
    Vibe = 'VibeQuestions',
    Weather = 'WeatherQuestions',
}
