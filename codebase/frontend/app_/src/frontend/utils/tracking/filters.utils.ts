import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ITrackingFilterOption } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { RangeFilterTrackingUnits } from 'models/enum/tracking/RangeFilterTrackingUnits';

// Handles the tracking values for filter selections that can't easily use English trackingId or name
export const getFilterSelectionTrackingName = (filter?: ITrackingFilterOption): string => {
    const defaultTrackingName = filter?.trackingId ?? filter?.name ?? 'All';

    if (!filter?.code) {
        return defaultTrackingName;
    }

    if (filter?.groupCode === FilterGroupCodes.Duration) {
        return `${filter.code} nights`;
    }

    if (filter?.groupCode === FilterGroupCodes.StarRating) {
        return `${filter.code} stars`;
    }

    if (filter?.groupCode === FilterGroupCodes.TripAdvisorRating) {
        if (filter.code === '5') {
            return '5 stars only';
        }

        return `${filter.code} stars & up`;
    }

    return defaultTrackingName;
};

// Use a consistent English format for the range filter tracking value, for simplified tracking across markets.
export const getRangeFilterTrackingValue = (
    minValue: string,
    maxValue: string,
    minValueUnit?: RangeFilterTrackingUnits,
    maxValueUnit?: RangeFilterTrackingUnits,
    includeSpaceBeforeUnit = false,
): string =>
    Tokenizer.replaceTokens(
        `From ${Tokens.Min}${includeSpaceBeforeUnit ? ' ' : ''}${Tokens.MinUnit} to ${Tokens.Max}${
            includeSpaceBeforeUnit ? ' ' : ''
        }${Tokens.MaxUnit}`,
        {
            [Tokens.Min]: minValue,
            [Tokens.Max]: maxValue,
            [Tokens.MinUnit]: minValueUnit ?? '',
            [Tokens.MaxUnit]: maxValueUnit ?? minValueUnit ?? '',
        },
    );
