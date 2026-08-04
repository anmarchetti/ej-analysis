import { ItemReference } from '@sitecore-jss/sitecore-jss-dev-tools';
import { PlaceholderProps } from '@sitecore-jss/sitecore-jss-react/types/components/PlaceholderCommon';
import { Dayjs } from 'dayjs';

import { DynamicQuestionTitle, StaticQuestionTitle } from 'models/enum/InspireMeQuiz';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import { IAirportCountry } from 'models/sitecore/IAirportsData';

export interface IRecommendedInspireData {
    destinations: IHolidayInspirationOffer[];
    trackingInfo: ITrackingSmartseerInfo;
}

interface ITrackingSmartseerInfo {
    apiUrl: string;
    pToken?: string;
    recoInfo?: {
        modelId: string;
        placementId: string;
        strategy: string;
    };
}

export interface IHolidayInspirationOffer {
    code: string;
    description: string;
    imageUrl: string;
    name: string;
    url: string;
}

export interface IValidateQuizAnswersParams {
    departure: string;
    weather: string;
}

export interface IGetQuizResultParams extends IValidateQuizAnswersParams {
    dates: { from: string; to: string }[];
    flexibleDays: number | undefined;
    tags: string | undefined;
    duration?: number;
}

export interface IQuizResult extends IGetQuizResultParams {
    from: string;
    to: string;
}

export interface ISmartSeerResultObject {
    action: string;
    context: {
        label: string;
        section: string;
        smartseer_quiz_answers: IQuizResult;
        type: string;
    };
    documentLocation: string;
    documentReferrer: string;
    listId: string;
    listOffset: number;
    pageSize: number;
    timestamp: string;
    trackingId: string;
    userAgent: string;
    userId: string;
    pageReferral?: string;
    ptoken?: string;
}

export interface IDatePickerTabAnswers {
    flexibleDays?: number;
    from?: Date | null;
    months?: Dayjs[];
    to?: Date | null;
}

export type TQuestionsTitle = StaticQuestionTitle | DynamicQuestionTitle;

export interface ITabDataWithGenericType<T> {
    answer: T;
    isShownOnProgressBar: boolean;
    title: TQuestionsTitle;
    progressBarTitle?: string;
}

export type TQuizTabData = ITabDataWithGenericType<any>;

export interface IHolidayInspirationFields {
    ProgressSubtitle: ISitecoreField<string | undefined>;
    ProgressTitle: ISitecoreField<string | undefined>;
}

export interface IQuestionsParams {
    ExcludedFromProgressBar: number;
}

export interface IStartQuizFields extends ITrackingFields {
    BackgroundImage?: IImageLoader[];
    Description?: ISitecoreField<string>;
    EditQuizCTAText?: ISitecoreField<string>;
    StartNewQuizCTAText?: ISitecoreField<string>;
    StartQuizCTAText?: ISitecoreField<string>;
    Title?: ISitecoreField<string>;
}

interface IDepartureAirportDataFields extends ITrackingFields {
    PickYourAirportLabel: ISitecoreField<string>;
    ProgressBarTitle?: ISitecoreField<string>;
    QuestionTitle?: ISitecoreField<string>;
}
export interface IDepartureAirportFields {
    airportsGroups: IAirportCountry[];
    data: IDepartureAirportDataFields;
}

export interface ITravelGroupFields extends ITrackingFields {
    QuestionTitle?: ISitecoreField<string>;
    TravelGroupOptions?: ITagOption[];
    TravelGroupQuestion?: ISitecoreField<string>;
}

export interface INotFoundTabFields {
    EditQuizCTAText?: ISitecoreField<string>;
    Subtitle?: ISitecoreField<string>;
    Title?: ISitecoreField<string>;
}

export interface ITagOption {
    fields: {
        Code: ISitecoreField<string>;
        Description: ISitecoreField<string>;
        Goal: ItemReference;
        Icon: ISitecoreField<ISitecoreImage>;
        Name: ISitecoreField<string>;
        TemperatureMax?: ISitecoreField<number>;
        TemperatureMin?: ISitecoreField<number>;
    };
    id: string;
}

export interface IThemeFields extends ITrackingFields {
    HolidayTypeOptions?: ITagOption[];
    HolidayTypeQuestions?: ISitecoreField<string>;
    HolidayVibeOptions?: ITagOption[];
    HolidayVibeQuestions?: ISitecoreField<string>;
    QuestionTitle?: ISitecoreField<string | undefined>;
    WeatherOptions?: ITagOption[];
    WeatherQuestions?: ISitecoreField<string>;
}

export interface IErrorFields extends ITrackingFields {
    BackgroundImage?: ISitecoreField<ISitecoreImage>;
    Description?: ISitecoreField<string>;
    RedirectCTA?: ISitecoreField<ISitecoreLink>;
    RefreshCTALabel?: ISitecoreField<string>;
    Title?: ISitecoreField<string>;
    WarningIcon?: ISitecoreField<ISitecoreImage>;
}

export interface IDatePickerFields extends ITrackingFields {
    ChangeMonthCTA: ISitecoreField<string>;
    DatePickerTabLabel: ISitecoreField<string>;
    FlexibleDatesLabel: ISitecoreField<string>;
    MonthPickerSubtitle: ISitecoreField<string>;
    MonthPickerTabLabel: ISitecoreField<string>;
    MonthPickerTitle: ISitecoreField<string>;
    QuestionTitle: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
}

export interface IDatePickerParams {
    IsCROVariant: TSitecoreCheckboxValue;
}

export type TDatePickerAnswer = [Date | undefined, Date | undefined];

export interface IImageLoader {
    fields: {
        Image: ISitecoreField<ISitecoreImage>;
    };
    id: string;
}

export interface IFinalQuizFields {
    Description?: ISitecoreField<string>;
    HeaderIconLoader?: ISitecoreField<ISitecoreImage>;
    HeaderImageLoader?: IImageLoader[];
    Title?: ISitecoreField<string>;
}

export interface IQuestionsFields extends IStartQuizFields, IDepartureAirportFields, ITrackingFields {
    ProgressBarTitle?: ISitecoreField<string>;
}

export interface IQuestionSitecoreData {
    props: {
        rendering: {
            componentName: string;
            dataSource: string | undefined;
            fields: IQuestionsFields;
            params: IQuestionsParams;
        };
    };
}

export type THolidayInspirationProps = PlaceholderProps &
    ISitecoreComponent<IHolidayInspirationFields> & {
        QuestionsData: IQuestionSitecoreData[];
    };

export interface IAvailableAnswers {
    availableMonths: number[];
}

export interface ITrackingFields {
    TrackingItemName: ISitecoreField<string>;
}
