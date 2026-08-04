import SitecoreDictionary from './SitecoreDictionary';

export interface ITimeUnitConfig {
    plural: SitecoreDictionary;
    singular: SitecoreDictionary;
    abbrPlural?: SitecoreDictionary;
    abbrSingular?: SitecoreDictionary;
}

export const TimeUnitsDictionary = {
    months: {
        plural: SitecoreDictionary.GlobalsLabelsTimeMonthsPlural,
        singular: SitecoreDictionary.GlobalsLabelsTimeMonthSingular,
    },
    days: {
        plural: SitecoreDictionary.GlobalsLabelsTimeDaysPlural,
        singular: SitecoreDictionary.GlobalsLabelsTimeDaySingular,
    },
    hours: {
        plural: SitecoreDictionary.GlobalsLabelsTimeHoursPlural,
        singular: SitecoreDictionary.GlobalsLabelsTimeHoursSingular,
        abbrPlural: SitecoreDictionary.GlobalsLabelsTimeHoursPluralAbbr,
        abbrSingular: SitecoreDictionary.GlobalsLabelsTimeHourSingularAbbr,
    },
    minutes: {
        plural: SitecoreDictionary.GlobalsLabelsTimeMinutesPlural,
        singular: SitecoreDictionary.GlobalsLabelsTimeMinuteSingular,
        abbrPlural: SitecoreDictionary.GlobalsLabelsTimeMinutesPluralAbbr,
        abbrSingular: SitecoreDictionary.GlobalsLabelsTimeMinuteSingularAbbr,
    },
    seconds: {
        plural: SitecoreDictionary.GlobalsLabelsTimeSecondsPlural,
        singular: SitecoreDictionary.GlobalsLabelsTimeSecondSingular,
        abbrPlural: SitecoreDictionary.GlobalsLabelsTimeSecondsPluralAbbr,
        abbrSingular: SitecoreDictionary.GlobalsLabelsTimeSecondSingularAbbr,
    },
};
