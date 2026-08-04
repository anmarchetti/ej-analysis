import { ISearchParamsPayload, ISeason } from 'frontend/store/base';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

export const mockSearchParamsPayload: ISearchParamsPayload = {
    departures: ['NYC', 'LAX'],
    destinations: [
        { code: 'TR', type: 'Country' },
        { code: 'EGHR', type: 'Region' },
        { code: 'ITLGBA', type: 'Resort' },
    ],
    duration: 14,
    from: new Date('2025-03-01T00:00:00Z'),
    to: new Date('2025-03-08T00:00:00Z'),
    rooms: [
        {
            roomCode: 'STANDARD456',
            adults: 1,
            children: 2,
            childrenAges: [3, 7],
            infants: 1,
        },
    ],
};

export const editorDestinationsQueryMock = ['country:TR', 'region:EGHR', 'resort:ITLGBA'];

export const mockSeasonsData: Date[] = [new Date('2025-02-10T00:00:00Z'), new Date('2025-02-18T00:00:00Z')];

export const mockDefaultSeason = {
    fields: { Code: mockSitecoreField('S001'), Name: mockSitecoreField('Default Season') },
};

export const mockSeasonWithDates = (endDate: string): { fields: ISeason } => ({
    fields: {
        Code: mockSitecoreField('S001'),
        Name: mockSitecoreField('Default Season'),
        StartDate: mockSitecoreField(new Date('2025-01-01')),
        EndDate: mockSitecoreField(new Date(endDate)),
    },
});
