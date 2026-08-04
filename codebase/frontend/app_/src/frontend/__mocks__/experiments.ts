import {
    ISitecorePersonalizeExperiment,
    ISitecorePersonalizeExperimentBase,
    ISitecorePersonalizeToken,
} from 'models/sitecore/ISitecorePersonalizeExperiment';

export const getBaseExperimentMock = (
    friendlyId: string,
    selectionAttr: string,
    ctas: ISitecorePersonalizeToken[] = [],
): ISitecorePersonalizeExperimentBase => ({
    friendlyId,
    selectionAttr,
    ctas,
});

export const getExperimentMock = (
    uniqueId: string,
    friendlyId: string,
    selectionAttr: string,
    ctas?: ISitecorePersonalizeToken[],
): ISitecorePersonalizeExperiment => ({
    uniqueId,
    ...getBaseExperimentMock(friendlyId, selectionAttr, ctas),
});

export const defaultExperimentMock = getBaseExperimentMock('geo_location__holidays_from_local_airport', 'Default');

export const beachExperimentMock = getBaseExperimentMock(
    'duplicate__ejh17492_search_for_2_adults_and_2_children_2',
    'beach',
    [
        {
            token: '{cta}',
            url: '/en/holidays/test/path-to-item?org=LTN',
        },
    ],
);

export const baseExperimentsMock: { [key: string]: ISitecorePersonalizeExperimentBase } = {
    'e9a6b953-05be-4f2b-a6a5-5b43aee87ea1': getBaseExperimentMock('ejh18098paxmixrule', 'Default'),
    'b6e7639f-c2ca-4821-b271-dbc5cca84932': beachExperimentMock,
    '60b60241-3c24-46dd-988a-5f742593ca59': getBaseExperimentMock('uk__holiday_type__why_book_with_us', 'Default'),
    '593461f8-e919-4d92-9943-61aad087f0e1': defaultExperimentMock,
    '337d57c1-cbd1-49c3-8f2b-ec749017c512': getBaseExperimentMock('promo_blocks__destination_profile_1', 'Default'),
    '7ce35360-33bb-4b8f-ab7f-1842224c9fba': getBaseExperimentMock('featured_hotels__destination_profile_1', 'Default'),
};
