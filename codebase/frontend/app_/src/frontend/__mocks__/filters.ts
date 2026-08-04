import { IFilterDestinationInfo, IFilterOption, IFilters, ISelectedFilter } from 'models/data/IFilters';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

export const mockRecommendedFilter: IFilters = {
    code: FilterGroupCodes.Recommended,
    name: FilterGroupCodes.Recommended,
    options: [
        {
            filterCode: FilterGroupCodes.BoardType,
            code: 'AI',
            name: 'All Inclusive',
            count: 248,
            children: [
                {
                    code: 'AI-',
                    name: 'All Inclusive Minus',
                    count: 0,
                },
                {
                    code: 'AI+',
                    name: 'All Inclusive Plus',
                    count: 0,
                },
                {
                    code: 'AS',
                    name: 'All Inclusive Premium',
                    count: 0,
                },
                {
                    code: 'TL',
                    name: 'All Inclusive Soft',
                    count: 0,
                },
                {
                    code: 'UAI',
                    name: 'Ultra All Inclusive',
                    count: 0,
                },
            ] as IFilterOption[],
        } as IFilterOption,
        {
            filterCode: FilterGroupCodes.BoardType,
            code: 'HB',
            name: 'Half Board',
            count: 397,
            children: [
                {
                    code: 'DAHB',
                    name: 'Dine Around Half Board',
                    count: 0,
                },
                {
                    code: 'HBE',
                    name: 'Half Board Exclusive',
                    count: 0,
                },
                {
                    code: 'HB-',
                    name: 'Half Board',
                    count: 0,
                },
                {
                    code: 'HB+',
                    name: 'Half Board Plus',
                    count: 0,
                },
                {
                    code: 'HB+-',
                    name: 'Half Board',
                    count: 0,
                },
                {
                    code: 'MB',
                    name: 'Half Board with Beverages Included',
                    count: 0,
                },
            ] as IFilterOption[],
        } as IFilterOption,
        {
            filterCode: FilterGroupCodes.FlightTimes,
            code: 'Outbound Departure Time|morning',
            name: 'Outbound Departure Time',
            count: 1,
            children: [
                {
                    code: 'morning ',
                    name: 'Morning departure',
                    count: 1,
                    startTime: '2021-06-11T06:00:00',
                    endTime: '2021-06-11T11:59:00',
                    atcomCode: 'A',
                },
            ] as unknown as IFilterOption[],
        } as IFilterOption,
        {
            filterCode: FilterGroupCodes.TripAdvisorRating,
            code: '4',
            name: '4+ TripAdvisor rating',
            count: 504,
            icon: 'family',
        } as IFilterOption,
        {
            filterCode: FilterGroupCodes.StarRating,
            code: '5',
            name: '5 Star Hotels',
            count: 84,
        } as IFilterOption,
        {
            filterCode: FilterGroupCodes.PackageTheme,
            code: 'B',
            name: 'Beach',
            count: 1,
            children: [
                {
                    code: 'BA',
                    name: 'Adults Holiday*',
                    count: 0,
                },
            ] as IFilterOption[],
        } as IFilterOption,
        {
            filterCode: FilterGroupCodes.Duration,
            code: '4',
            name: '4 nights',
            count: 1,
        } as IFilterOption,
        {
            filterCode: FilterGroupCodes.Facilities,
            name: 'Pool & Beach',
            count: 173,
            children: [
                {
                    code: '73-360',
                    name: 'Indoor pool*',
                    count: 173,
                },
            ] as IFilterOption[],
        } as IFilterOption,
    ],
};

export const mockFilterDepartureAirport: IFilters = {
    code: FilterGroupCodes.AltFlightsDepartureAirports,
    options: [
        {
            code: 'BFS',
            name: 'Belfast International',
            groupCode: FilterGroupCodes.AltFlightsDepartureAirports,
            count: 5,
        },
        {
            code: 'BRS',
            name: 'Bristol',
            groupCode: FilterGroupCodes.AltFlightsDepartureAirports,
            count: 1,
        },
        {
            code: 'LGW',
            name: 'London Gatwick',
            groupCode: FilterGroupCodes.AltFlightsDepartureAirports,
            count: 10,
        },
        {
            code: 'LTN',
            name: 'London Luton',
            groupCode: FilterGroupCodes.AltFlightsDepartureAirports,
            count: 4,
        },
        {
            code: 'MAN',
            name: 'Manchester',
            groupCode: FilterGroupCodes.AltFlightsDepartureAirports,
            count: 1,
        },
    ],
    name: FilterGroupCodes.AltFlightsDepartureAirports,
};

export const mockFilterOutboundDepartureTime: IFilters = {
    code: FilterGroupCodes.AltFlightsOutboundDepartureTime,
    options: [
        {
            groupCode: FilterGroupCodes.AltFlightsOutboundDepartureTime,
            code: 'earlyMorning',
            name: 'Early Morning (00:00-05:59)',
            pillLabel: 'Outbound early morning (00:00-05:59) flight',
            count: 0,
            timeSlot: {
                start: '0000',
                end: '0559',
            },
        },
        {
            groupCode: FilterGroupCodes.AltFlightsOutboundDepartureTime,
            code: 'morning ',
            name: 'Morning (06:00-11:59)',
            pillLabel: 'Outbound morning (06:00-11:59) flight',
            count: 5,
            timeSlot: {
                start: '0600',
                end: '1159',
            },
        },
        {
            groupCode: FilterGroupCodes.AltFlightsOutboundDepartureTime,
            code: 'afternoon',
            name: 'Afternoon (12:00-17:59)',
            pillLabel: 'Outbound afternoon (12:00-17:59) flight',
            count: 11,
            timeSlot: {
                start: '1200',
                end: '1759',
            },
        },
        {
            groupCode: FilterGroupCodes.AltFlightsOutboundDepartureTime,
            code: 'earlyEvening',
            name: 'Early Evening (18:00-20:59)',
            pillLabel: 'Outbound early evening (18:00-20:59) flight',
            count: 4,
            timeSlot: {
                start: '1800',
                end: '2059',
            },
        },
        {
            groupCode: FilterGroupCodes.AltFlightsOutboundDepartureTime,
            code: 'evening',
            name: 'Evening (21:00-23:59)',
            pillLabel: 'Outbound evening (21:00-23:59) flight',
            count: 1,
            timeSlot: {
                start: '2100',
                end: '2359',
            },
        },
    ],
    name: FilterGroupCodes.AltFlightsOutboundDepartureTime,
};

export const mockFilterInboundDepartureTime: IFilters = {
    code: FilterGroupCodes.AltFlightsInboundDepartureTime,
    options: [
        {
            groupCode: FilterGroupCodes.AltFlightsInboundDepartureTime,
            code: 'earlyMorning',
            name: 'Early Morning (00:00-05:59)',
            pillLabel: 'Inbound early morning (00:00-05:59) flight',
            count: 0,
            timeSlot: {
                start: '0000',
                end: '0559',
            },
        },
        {
            groupCode: FilterGroupCodes.AltFlightsInboundDepartureTime,
            code: 'morning ',
            name: 'Morning (06:00-11:59)',
            pillLabel: 'Inbound morning (06:00-11:59) flight',
            count: 8,
            timeSlot: {
                start: '0600',
                end: '1159',
            },
        },
        {
            groupCode: FilterGroupCodes.AltFlightsInboundDepartureTime,
            code: 'afternoon',
            name: 'Afternoon (12:00-17:59)',
            pillLabel: 'Inbound afternoon (12:00-17:59) flight',
            count: 6,
            timeSlot: {
                start: '1200',
                end: '1759',
            },
        },
        {
            groupCode: FilterGroupCodes.AltFlightsInboundDepartureTime,
            code: 'earlyEvening',
            name: 'Early Evening (18:00-20:59)',
            pillLabel: 'Inbound early evening (18:00-20:59) flight',
            count: 3,
            timeSlot: {
                start: '1800',
                end: '2059',
            },
        },
        {
            groupCode: FilterGroupCodes.AltFlightsInboundDepartureTime,
            code: 'evening',
            name: 'Evening (21:00-23:59)',
            pillLabel: 'Inbound evening (21:00-23:59) flight',
            count: 4,
            timeSlot: {
                start: '2100',
                end: '2359',
            },
        },
    ],
    name: FilterGroupCodes.AltFlightsInboundDepartureTime,
};

export const mockAltFlightsFilters: IFilters[] = [
    mockFilterDepartureAirport,
    mockFilterOutboundDepartureTime,
    mockFilterInboundDepartureTime,
];

export const mockFlightSelectedFilter: ISelectedFilter = {
    code: 'code',
    name: 'name',
    groupCode: FilterGroupCodes.AltFlightsDepartureAirports,
    preChecked: false,
    destinationInfo: {
        parent: 'destinationInfo_parent',
        relatedRegions: ['ALC', 'NYC'],
        relatedResorts: [],
        type: DestinationType.Region,
    },
    timeSlot: {
        start: '0900',
        end: '1200',
    },
    atcomCode: 'crack',
};

export const mockDestinationFilters: IFilterOption[] = [
    {
        code: 'HR',
        name: 'Croatia',
        count: 1,
        children: [
            {
                code: 'HRDB',
                name: 'Dubrovnik',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'HRIR',
                name: 'Istrian Riviera',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'HRSP',
                name: 'Split',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
        ],
        destinationInfo: {
            type: DestinationType.Country,
        } as IFilterDestinationInfo,
        groupCode: FilterGroupCodes.Destination,
    },
    {
        code: 'CY',
        name: 'Cyprus',
        count: 1,
        children: [
            {
                code: 'CYLN',
                name: 'Larnaca',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'CYPF',
                name: 'Paphos',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
        ],
        destinationInfo: {
            type: DestinationType.Country,
        } as IFilterDestinationInfo,
        groupCode: FilterGroupCodes.Destination,
    },
    {
        code: 'PTMD',
        name: 'Madeira',
        count: 1,
        children: [
            {
                code: 'PTMDCA',
                name: 'Calheta',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PTMDCL',
                name: 'Canical',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PTMDCN',
                name: 'Canico',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PTMDFU',
                name: 'Funchal',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PTMDFT',
                name: 'Funchal Old Town',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PTMDPC',
                name: 'Ponta da Cruz',
                count: 0,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PTMDPS',
                name: 'Ponta do Sol',
                count: 0,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PTMDSC',
                name: 'Santa Cruz',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PTMDSA',
                name: 'Santana',
                count: 0,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PTMDSV',
                name: 'Sao Vicente',
                count: 0,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
        ],
        destinationInfo: {
            parent: 'PT',
            type: DestinationType.Region,
        } as IFilterDestinationInfo,
        groupCode: FilterGroupCodes.Destination,
    },
];

export const selectedDestinationFilters: ISelectedFilter[] = [
    {
        code: 'HRDB',
        name: 'Dubrovnik',
        groupCode: FilterGroupCodes.Destination,
        destinationInfo: {
            type: DestinationType.Region,
        } as IFilterDestinationInfo,
    },
    {
        code: 'CYLN',
        name: 'Larnaca',
        groupCode: FilterGroupCodes.Destination,
        destinationInfo: {
            type: DestinationType.Region,
        } as IFilterDestinationInfo,
    },
    {
        code: 'CYPF',
        name: 'Paphos',
        groupCode: FilterGroupCodes.Destination,
        destinationInfo: {
            type: DestinationType.Region,
        } as IFilterDestinationInfo,
    },
    {
        code: 'CY',
        name: 'Cyprus',
        groupCode: FilterGroupCodes.Destination,
        destinationInfo: {
            type: DestinationType.Country,
        } as IFilterDestinationInfo,
    },
];

export const selectedFilterWithDestinationInfo: ISelectedFilter[] = [
    {
        code: 'PTMDCA',
        name: 'Calheta',
        groupCode: FilterGroupCodes.Destination,
        destinationInfo: {
            type: DestinationType.Resort,
        } as IFilterDestinationInfo,
    },
];

export const mockDestinationVirtualCountryFilters: IFilterOption[] = [
    {
        code: 'VGBSC',
        name: 'Scotland',
        groupCode: FilterGroupCodes.Destination,
        count: 0,
        children: [
            {
                code: 'GBSCIN',
                name: 'Inverness City',
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
            } as IFilterOption,
            {
                code: 'GBSCGL',
                name: 'Glasgow City',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
            } as IFilterOption,
            {
                code: 'GBSCED',
                name: 'Edinburgh City',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
            } as IFilterOption,
        ],
        destinationInfo: {
            parent: 'GB',
            relatedRegions: ['GBSC'],
            type: DestinationType.VirtualCountry,
        } as IFilterDestinationInfo,
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        count: 0,
        children: [
            {
                code: 'GBCI',
                name: 'Channel Islands',
                count: 0,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
            } as IFilterOption,
            {
                code: 'GBEN',
                name: 'England',
                count: 0,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
            } as IFilterOption,
            {
                code: 'GBNI',
                name: 'Northern Ireland',
                count: 0,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
            } as IFilterOption,
            {
                code: 'GBSC',
                name: 'Scotland',
                count: 0,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
            } as IFilterOption,
        ],
        destinationInfo: {
            type: DestinationType.Country,
        },
    } as IFilterOption,
];

export const mockDestinationVirtualRegionFilters: IFilterOption[] = [
    {
        code: 'VAND',
        name: 'Andalucia',
        groupCode: FilterGroupCodes.Destination,
        count: 1,
        destinationInfo: {
            type: DestinationType.VirtualRegion,
            relatedRegions: ['ESCD', 'ESAL', 'ESSV', 'ESCT'],
        } as IFilterDestinationInfo,
        children: [
            {
                code: 'ESAL',
                name: 'Costa de Almeria',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
        ],
    },
    {
        code: 'ESAL',
        name: 'Costa de Almeria',
        groupCode: FilterGroupCodes.Destination,
        count: 1,
        destinationInfo: {
            type: DestinationType.Region,
            parent: 'ES',
        } as IFilterDestinationInfo,
        children: [
            {
                code: 'ESALMO',
                name: 'Mojacar',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
        ],
    },
    {
        code: 'BIV',
        name: 'Balearic Islands',
        groupCode: FilterGroupCodes.Destination,
        count: 1,
        destinationInfo: {
            type: DestinationType.VirtualRegion,
        } as IFilterDestinationInfo,
        children: [
            {
                code: 'ESIB',
                name: 'Ibiza',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Region,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
        ],
    },
    {
        code: 'ESIB',
        name: 'Ibiza',
        groupCode: FilterGroupCodes.Destination,
        count: 1,
        destinationInfo: {
            type: DestinationType.Region,
            parent: 'ES',
        } as IFilterDestinationInfo,
        children: [
            {
                code: 'ESIBIB',
                name: 'Ibiza Bay',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
        ],
    },
];

export const availableFilters: IFilters[] = [
    {
        code: FilterGroupCodes.Destination,
        name: FilterGroupCodes.Regions,
        options: [
            {
                code: 'AT',
                name: 'Austria',
                count: 0,
                children: [
                    {
                        code: 'ATAT',
                        name: 'Salzburg',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'BG',
                name: 'Bulgaria',
                count: 1,
                children: [
                    {
                        code: 'BGBO',
                        name: 'Bourgas',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'BGSO',
                        name: 'Sofia',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'BGVR',
                        name: 'Varna',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'VGBCI',
                name: 'Channel Islands',
                count: 1,
                children: [
                    {
                        code: 'GBCIJE',
                        name: 'Jersey',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Resort,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    parent: 'GB',
                    relatedRegions: ['GBCI'],
                    relatedResorts: [],
                    type: DestinationType.VirtualCountry,
                },
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'HR',
                name: 'Croatia',
                count: 1,
                children: [
                    {
                        code: 'HRDB',
                        name: 'Dubrovnik',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'HRIR',
                        name: 'Istrian Riviera',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'HRSP',
                        name: 'Split',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'HRZA',
                        name: 'Zadar',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'CY',
                name: 'Cyprus',
                count: 1,
                children: [
                    {
                        code: 'CYLN',
                        name: 'Larnaca',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'CYPF',
                        name: 'Paphos',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'CZ',
                name: 'Czech Republic',
                count: 1,
                children: [
                    {
                        code: 'CZPR',
                        name: 'Prague',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'DK',
                name: 'Denmark',
                count: 1,
                children: [
                    {
                        code: 'DKCP',
                        name: 'Copenhagen',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'EG',
                name: 'Egypt',
                count: 0,
                children: [
                    {
                        code: 'EGHR',
                        name: 'Hurghada',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'EGRS',
                        name: 'Red Sea',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'EGSS',
                        name: 'Sharm el Sheikh',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'VGBEN',
                name: 'England',
                count: 0,
                children: [
                    {
                        code: 'GBENLP',
                        name: 'Liverpool',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Resort,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GBENLO',
                        name: 'London City',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Resort,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GBENMA',
                        name: 'Manchester',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Resort,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    parent: 'GB',
                    relatedRegions: ['GBEN'],
                    relatedResorts: [],
                    type: DestinationType.VirtualCountry,
                },
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'FR',
                name: 'France',
                count: 1,
                children: [
                    {
                        code: 'FRBO',
                        name: 'Bordeaux',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'FRCO',
                        name: 'Corsica',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'FRFR',
                        name: 'French Riviera',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'FRLY',
                        name: 'Lyon',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'FRMA',
                        name: 'Marseille',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'FRMO',
                        name: 'Montpellier',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'FRNA',
                        name: 'Nantes',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'FRNI',
                        name: 'Nice',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'FRPA',
                        name: 'Paris',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'FRTO',
                        name: 'Toulouse',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'DE',
                name: 'Germany',
                count: 1,
                children: [
                    {
                        code: 'DEBE',
                        name: 'Berlin',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'DEHA',
                        name: 'Hamburg',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'DEMU',
                        name: 'Munich',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'GI',
                name: 'Gibraltar',
                count: 1,
                children: [
                    {
                        code: 'GIGI',
                        name: 'Gibraltar',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'GR',
                name: 'Greece',
                count: 1,
                children: [
                    {
                        code: 'GRAT',
                        name: 'Athens',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRCG',
                        name: 'Central Greece',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRCF',
                        name: 'Corfu',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRCR',
                        name: 'Crete',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GIV',
                        name: 'Greek Islands',
                        count: 1,
                        destinationInfo: {
                            relatedRegions: ['GRCR', 'GRZA', 'GRCF', 'GRKF', 'GRSN', 'GRKG', 'GRRH', 'GRMK', 'GRLE'],
                            type: DestinationType.VirtualRegion,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRHA',
                        name: 'Halkidiki',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRKF',
                        name: 'Kefalonia',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRKG',
                        name: 'Kos',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRLE',
                        name: 'Lefkada',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRMK',
                        name: 'Mykonos',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRPE',
                        name: 'Peloponnese',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRRH',
                        name: 'Rhodes',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRSN',
                        name: 'Santorini',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRTH',
                        name: 'Thessaloniki',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GRZA',
                        name: 'Zante',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'HU',
                name: 'Hungary',
                count: 1,
                children: [
                    {
                        code: 'HUBU',
                        name: 'Budapest',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'IS',
                name: 'Iceland',
                count: 1,
                children: [
                    {
                        code: 'ISIC',
                        name: 'Iceland',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'IL',
                name: 'Israel',
                count: 1,
                children: [
                    {
                        code: 'ILJE',
                        name: 'Jerusalem',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ILTA',
                        name: 'Tel Aviv',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'IT',
                name: 'Italy',
                count: 1,
                children: [
                    {
                        code: 'ITBO',
                        name: 'Bologna',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITBR',
                        name: 'Brindisi',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITSO',
                        name: 'Campania',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITGE',
                        name: 'Genoa',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'VITL',
                        name: 'Italian Lakes',
                        count: 1,
                        destinationInfo: {
                            relatedRegions: ['ITLC', 'ITLG', 'ITML'],
                            type: DestinationType.VirtualRegion,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITLC',
                        name: 'Lake Como',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITLG',
                        name: 'Lake Garda',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITML',
                        name: 'Lake Maggiore',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITMI',
                        name: 'Milan',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITNA',
                        name: 'Naples',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITPI',
                        name: 'Pisa',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITPU',
                        name: 'Puglia',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITRI',
                        name: 'Rimini',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITRO',
                        name: 'Rome',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITSA',
                        name: 'Sardinia',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITSI',
                        name: 'Sicily',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITTU',
                        name: 'Turin',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITTS',
                        name: 'Tuscany',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITVE',
                        name: 'Venice',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ITVR',
                        name: 'Verona',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'JO',
                name: 'Jordan',
                count: 0,
                children: [
                    {
                        code: 'JOAQ',
                        name: 'Aqaba',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'LU',
                name: 'Luxembourg',
                count: 0,
                children: [
                    {
                        code: 'LULU',
                        name: 'Luxembourg',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'MT',
                name: 'Malta',
                count: 1,
                children: [
                    {
                        code: 'MTMT',
                        name: 'Malta',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'MC',
                name: 'Monaco',
                count: 1,
                children: [
                    {
                        code: 'MCMC',
                        name: 'Monaco',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'ME',
                name: 'Montenegro',
                count: 1,
                children: [
                    {
                        code: 'METI',
                        name: 'Tivat',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'MA',
                name: 'Morocco',
                count: 1,
                children: [
                    {
                        code: 'MAAG',
                        name: 'Agadir',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'MAMA',
                        name: 'Marrakech',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'NL',
                name: 'Netherlands',
                count: 1,
                children: [
                    {
                        code: 'NLAM',
                        name: 'Amsterdam',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'VGBNI',
                name: 'Northern Ireland',
                count: 1,
                children: [
                    {
                        code: 'GBNIBC',
                        name: 'Belfast City',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Resort,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    parent: 'GB',
                    relatedRegions: ['GBNI'],
                    relatedResorts: [],
                    type: DestinationType.VirtualCountry,
                },
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PL',
                name: 'Poland',
                count: 1,
                children: [
                    {
                        code: 'PLKR',
                        name: 'Krakow',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'PT',
                name: 'Portugal',
                count: 1,
                children: [
                    {
                        code: 'PTAL',
                        name: 'Algarve',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'PTEC',
                        name: 'Estoril Coast',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'PTLI',
                        name: 'Lisbon',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'PTMD',
                        name: 'Madeira',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'PTPO',
                        name: 'Porto',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'VGBSC',
                name: 'Scotland',
                count: 1,
                children: [
                    {
                        code: 'GBSCED',
                        name: 'Edinburgh City',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Resort,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GBSCGL',
                        name: 'Glasgow City',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Resort,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'GBSCIN',
                        name: 'Inverness City',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Resort,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    parent: 'GB',
                    relatedRegions: ['GBSC'],
                    relatedResorts: [],
                    type: DestinationType.VirtualCountry,
                },
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'SI',
                name: 'Slovenia',
                count: 1,
                children: [
                    {
                        code: 'SILJ',
                        name: 'Ljubljana',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'ES',
                name: 'Spain',
                count: 1,
                children: [
                    {
                        code: 'VAND',
                        name: 'Andalucia',
                        count: 1,
                        destinationInfo: {
                            relatedRegions: ['ESCD', 'ESAL', 'ESSV', 'ESGR'],
                            type: DestinationType.VirtualRegion,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'BIV',
                        name: 'Balearic Islands',
                        count: 1,
                        destinationInfo: {
                            relatedRegions: ['ESIB', 'ESMN', 'ESMJ'],
                            type: DestinationType.VirtualRegion,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESBA',
                        name: 'Barcelona',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESBI',
                        name: 'Bilbao',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESDZ',
                        name: 'Cadiz',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'CIV',
                        name: 'Canary Islands',
                        count: 1,
                        destinationInfo: {
                            relatedRegions: ['ESTF', 'ESLZ', 'ESGC', 'ESFU'],
                            type: DestinationType.VirtualRegion,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESCB',
                        name: 'Costa Blanca',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESBV',
                        name: 'Costa Brava',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESCC',
                        name: 'Costa Calida',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESAL',
                        name: 'Costa De Almeria',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESCD',
                        name: 'Costa Del Sol',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESDO',
                        name: 'Costa Dorada',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESCO',
                        name: 'Costa de la Luz',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESFU',
                        name: 'Fuerteventura',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESGC',
                        name: 'Gran Canaria',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESGR',
                        name: 'Granada',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESIB',
                        name: 'Ibiza',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESLZ',
                        name: 'Lanzarote',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESMA',
                        name: 'Madrid',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESMJ',
                        name: 'Majorca',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESMN',
                        name: 'Menorca',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESMU',
                        name: 'Murcia',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESSV',
                        name: 'Seville',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESTF',
                        name: 'Tenerife',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'ESVA',
                        name: 'Valencia',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'CH',
                name: 'Switzerland',
                count: 1,
                children: [
                    {
                        code: 'CHBA',
                        name: 'Basel',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'CHGE',
                        name: 'Geneva',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'CHZU',
                        name: 'Zurich',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'TN',
                name: 'Tunisia',
                count: 0,
                children: [
                    {
                        code: 'TNNB',
                        name: 'Tunisia Area',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
            {
                code: 'TR',
                name: 'Turkey',
                count: 1,
                children: [
                    {
                        code: 'TRAN',
                        name: 'Antalya',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'TRBD',
                        name: 'Bodrum',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'TRDL',
                        name: 'Dalaman',
                        count: 1,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                    {
                        code: 'TRIZ',
                        name: 'Izmir',
                        count: 0,
                        destinationInfo: {
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                destinationInfo: {
                    type: DestinationType.Country,
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            },
        ],
    },
    {
        code: FilterGroupCodes.StarRating,
        name: FilterGroupCodes.StarRating,
        options: [
            {
                code: '1',
                name: '1 star',
                count: 1,
                groupCode: FilterGroupCodes.StarRating,
            },
            {
                code: '2',
                name: '2 stars',
                count: 22,
                groupCode: FilterGroupCodes.StarRating,
            },
            {
                code: '3',
                name: '3 stars',
                count: 264,
                groupCode: FilterGroupCodes.StarRating,
            },
            {
                code: '4',
                name: '4 stars',
                count: 638,
                groupCode: FilterGroupCodes.StarRating,
            },
            {
                code: '5',
                name: '5 stars',
                count: 283,
                groupCode: FilterGroupCodes.StarRating,
            },
        ],
    },
    {
        code: FilterGroupCodes.Flights,
        name: FilterGroupCodes.Flights,
        options: [
            {
                code: 'LGW',
                name: 'London Gatwick',
                count: 1,
                groupCode: FilterGroupCodes.Flights,
            },
            {
                code: 'STN',
                name: 'London Stansted',
                count: 1,
                groupCode: FilterGroupCodes.Flights,
            },
            {
                code: 'LTN',
                name: 'London Luton',
                count: 1,
                groupCode: FilterGroupCodes.Flights,
            },
            {
                code: 'SEN',
                name: 'London Southend',
                count: 1,
                groupCode: FilterGroupCodes.Flights,
            },
        ],
    },
    {
        code: FilterGroupCodes.Duration,
        name: FilterGroupCodes.Duration,
        options: [
            {
                code: '2',
                count: 1,
                name: '2 nights',
                preChecked: false,
                groupCode: FilterGroupCodes.Duration,
            },
            {
                code: '3',
                count: 1,
                name: '3 nights',
                preChecked: false,
                groupCode: FilterGroupCodes.Duration,
            },
            {
                code: '4',
                count: 1,
                name: '4 nights',
                preChecked: false,
                groupCode: FilterGroupCodes.Duration,
            },
            {
                code: '5',
                count: 1,
                name: '5 nights',
                preChecked: false,
                groupCode: FilterGroupCodes.Duration,
            },
            {
                code: '6',
                count: 1,
                name: '6 nights',
                preChecked: false,
                groupCode: FilterGroupCodes.Duration,
            },
            {
                code: '7',
                count: 1,
                name: '7 nights',
                preChecked: false,
                groupCode: FilterGroupCodes.Duration,
            },
            {
                code: '8',
                count: 1,
                name: '8 nights',
                preChecked: false,
                groupCode: FilterGroupCodes.Duration,
            },
            {
                code: '9',
                count: 1,
                name: '9 nights',
                preChecked: false,
                groupCode: FilterGroupCodes.Duration,
            },
        ],
    },
    {
        code: FilterGroupCodes.PriceRange,
        name: FilterGroupCodes.PriceRange,
        options: [
            {
                code: 'priceRange_Filter',
                name: 'priceRange_FilterName',
                count: 0,
                groupCode: FilterGroupCodes.PriceRange,
            },
        ],
    },
    {
        code: FilterGroupCodes.FlightTimes,
        name: FilterGroupCodes.FlightTimes,
        options: [
            {
                name: 'Inbound Departure Time',
                count: 1,
                children: [
                    {
                        code: 'earlyMorning',
                        name: 'Early Morning (00:00-05:59)',
                        count: 1,
                        startTime: '2021-06-11T00:00:00',
                        endTime: '2021-06-11T05:59:00',
                        atcomCode: 'D',
                        groupCode: FilterGroupCodes.FlightTimes,
                    } as IFilterOption,
                    {
                        code: 'morning ',
                        name: 'Morning (06:00-11:59)',
                        count: 1,
                        startTime: '2021-06-11T06:00:00',
                        endTime: '2021-06-11T11:59:00',
                        atcomCode: 'A',
                        groupCode: FilterGroupCodes.FlightTimes,
                    },
                    {
                        code: 'afternoon',
                        name: 'Afternoon (12:00-17:59)',
                        count: 1,
                        startTime: '2021-06-11T12:00:00',
                        endTime: '2021-06-11T17:59:00',
                        atcomCode: 'B',
                        groupCode: FilterGroupCodes.FlightTimes,
                    },
                    {
                        code: 'earlyEvening',
                        name: 'Early Evening (18:00-20:59)',
                        count: 1,
                        startTime: '2021-06-11T18:00:00',
                        endTime: '2021-06-11T20:59:00',
                        atcomCode: 'C',
                        groupCode: FilterGroupCodes.FlightTimes,
                    },
                    {
                        code: 'evening',
                        name: 'Evening (21:00-23:59)',
                        count: 1,
                        startTime: '2021-06-11T21:00:00',
                        endTime: '2021-06-11T23:59:00',
                        atcomCode: 'D',
                        groupCode: FilterGroupCodes.FlightTimes,
                    },
                ] as IFilterOption[],
                groupCode: FilterGroupCodes.FlightTimes,
            },
            {
                name: 'Outbound Departure Time',
                count: 1,
                children: [
                    {
                        code: 'earlyMorning',
                        name: 'Early Morning (00:00-05:59)',
                        count: 1,
                        startTime: '2021-06-11T00:00:00',
                        endTime: '2021-06-11T05:59:00',
                        atcomCode: 'D',
                        groupCode: 'timeSlots',
                    } as IFilterOption,
                    {
                        code: 'morning ',
                        name: 'Morning (06:00-11:59)',
                        count: 1,
                        startTime: '2021-06-11T06:00:00',
                        endTime: '2021-06-11T11:59:00',
                        atcomCode: 'A',
                        groupCode: 'timeSlots',
                    },
                    {
                        code: 'afternoon',
                        name: 'Afternoon (12:00-17:59)',
                        count: 1,
                        startTime: '2021-06-11T12:00:00',
                        endTime: '2021-06-11T17:59:00',
                        atcomCode: 'B',
                        groupCode: 'timeSlots',
                    },
                    {
                        code: 'earlyEvening',
                        name: 'Early Evening (18:00-20:59)',
                        count: 1,
                        startTime: '2021-06-11T18:00:00',
                        endTime: '2021-06-11T20:59:00',
                        atcomCode: 'C',
                        groupCode: 'timeSlots',
                    },
                    {
                        code: 'evening',
                        name: 'Evening (21:00-23:59)',
                        count: 1,
                        startTime: '2021-06-11T21:00:00',
                        endTime: '2021-06-11T23:59:00',
                        atcomCode: 'D',
                        groupCode: 'timeSlots',
                    },
                ] as IFilterOption[],
                groupCode: 'timeSlots',
            },
        ] as IFilterOption[],
    },
    {
        code: FilterGroupCodes.PackageTheme,
        name: FilterGroupCodes.PackageTheme,
        options: [
            {
                code: 'B',
                name: 'Beach',
                count: 833,
                children: [
                    {
                        code: 'BA',
                        name: 'Adults Holiday',
                        count: 106,
                        icon: '/-/jssmedia/9fa7f2668d54488eb6cf37f609cf991d.ashx',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                    {
                        code: 'BF',
                        name: 'Family Holiday',
                        count: 126,
                        icon: '/-/jssmedia/f22fcf7eb95c4a3bbb4e9dfcaa0dc8ef.ashx',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                    {
                        code: 'BL',
                        name: 'Luxury Holiday',
                        count: 83,
                        icon: '/-/jssmedia/b7c1f927ae7b486f98714256a837c7f1.ashx',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                    {
                        code: 'BU',
                        name: 'Undiscovered Holiday',
                        count: 18,
                        icon: '/-/jssmedia/8857adce3e544ca7890df9acb3e9148b.ashx',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                ],
                groupCode: FilterGroupCodes.PackageTheme,
            },
            {
                code: 'C',
                name: 'City',
                count: 420,
                children: [
                    {
                        code: 'CB',
                        name: 'Boutique Break',
                        count: 79,
                        icon: '/-/jssmedia/049f531804ec40be8cccf7fa2e4c1f12.ashx',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                    {
                        code: 'CL',
                        name: 'Luxury Break',
                        count: 46,
                        icon: '/-/jssmedia/b7c1f927ae7b486f98714256a837c7f1.ashx',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                ],
                groupCode: FilterGroupCodes.PackageTheme,
            },
            {
                code: 'L',
                name: 'Lakes',
                count: 0,
                children: [
                    {
                        code: 'LB',
                        name: 'Boutique Holiday',
                        count: 0,
                        icon: '/-/jssmedia/049f531804ec40be8cccf7fa2e4c1f12.ashx',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                    {
                        code: 'LL',
                        name: 'Luxury Holiday',
                        count: 0,
                        icon: '/-/jssmedia/b7c1f927ae7b486f98714256a837c7f1.ashx',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                    {
                        code: 'LU',
                        name: 'Undiscovered Holiday',
                        count: 0,
                        icon: '/-/jssmedia/8857adce3e544ca7890df9acb3e9148b.ashx',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                ],
                groupCode: FilterGroupCodes.PackageTheme,
            },
        ],
    },
    {
        code: FilterGroupCodes.BoardType,
        name: FilterGroupCodes.BoardType,
        options: [
            {
                code: 'HB',
                name: 'Half Board',
                count: 467,
                children: [
                    {
                        code: 'HB-',
                        name: 'Half Board',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                    {
                        code: 'HB+',
                        name: 'Half board plus',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                    {
                        code: 'HB+-',
                        name: 'Half Board',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                    {
                        code: 'MB',
                        name: 'Half Board with Beverages Included',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                ],
                groupCode: FilterGroupCodes.BoardType,
            },
            {
                code: 'BB',
                name: 'Bed and Breakfast',
                count: 858,
                children: [
                    {
                        code: 'BB-',
                        name: 'Bed and Breakfast',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                    {
                        code: 'BB+',
                        name: 'Bed and Breakfast Plus',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                ],
                groupCode: FilterGroupCodes.BoardType,
            },
            {
                code: 'AI',
                name: 'All Inclusive',
                count: 366,
                children: [
                    {
                        code: 'AI+',
                        name: 'All inclusive plus',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                    {
                        code: 'AS',
                        name: 'All Inclusive Premium',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                    {
                        code: 'TL',
                        name: 'All Inclusive Soft',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                ],
                groupCode: FilterGroupCodes.BoardType,
            },
            {
                code: 'RO',
                name: 'Room Only',
                count: 388,
                children: [
                    {
                        code: 'RO-',
                        name: 'Room Only',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                ],
                groupCode: FilterGroupCodes.BoardType,
            },
            {
                code: 'SC',
                name: 'Self catering',
                count: 92,
                children: [
                    {
                        code: 'SC-',
                        name: 'Self Catering',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                ],
                groupCode: FilterGroupCodes.BoardType,
            },
            {
                code: 'FB',
                name: 'Full Board',
                count: 112,
                children: [
                    {
                        code: 'FB-',
                        name: 'Full Board',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                    {
                        code: 'FB+',
                        name: 'Full board plus',
                        count: 0,
                        groupCode: FilterGroupCodes.BoardType,
                    },
                ],
                groupCode: FilterGroupCodes.BoardType,
            },
        ],
    },
    {
        code: FilterGroupCodes.Facilities,
        name: FilterGroupCodes.Facilities,
        options: [
            {
                name: 'Pool & Beach',
                count: 4,
                children: [
                    {
                        code: '73-363',
                        name: 'Outdoor pool',
                        count: 832,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                    {
                        code: '73-360',
                        name: 'Indoor pool',
                        count: 270,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                    {
                        code: '73-620',
                        name: 'Water park',
                        count: 24,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                    {
                        code: '73-610',
                        name: 'Water slides',
                        count: 96,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                ],
                groupCode: FilterGroupCodes.Facilities,
            },
            {
                name: 'Entertainment',
                count: 1,
                children: [
                    {
                        code: '73-401',
                        name: 'Entertainment programme',
                        count: 478,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                ],
                groupCode: FilterGroupCodes.Facilities,
            },
            {
                name: 'Family',
                count: 3,
                children: [
                    {
                        code: '73-350',
                        name: 'Playground',
                        count: 328,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                    {
                        code: '73-385',
                        name: "Children's pool",
                        count: 402,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                    {
                        code: '73-340',
                        name: 'Kids club',
                        count: 326,
                        facilityFilterGroup: {
                            code: '73-340',
                            name: 'Kids club',
                            parentName: 'Entertainment',
                            parentCode: '73',
                            tooltip: '',
                        },
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                ],
                groupCode: FilterGroupCodes.Facilities,
            },
            {
                name: 'General',
                count: 2,
                children: [
                    {
                        code: '70-10',
                        name: 'Air conditioning',
                        count: 959,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                    {
                        code: '70-550',
                        name: 'Wi-fi',
                        count: 1197,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                ],
                groupCode: FilterGroupCodes.Facilities,
            },
            {
                name: 'Sports & Health',
                count: 2,
                children: [
                    {
                        code: '74-620',
                        name: 'Spa centre',
                        count: 343,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                    {
                        code: '70-470',
                        name: 'Gym',
                        count: 646,
                        tooltipText: '',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                ],
                groupCode: FilterGroupCodes.Facilities,
            },
            {
                name: 'Environmental',
                count: 1,
                children: [
                    {
                        code: '70-ECO',
                        name: 'Eco certified',
                        count: 205,
                        tooltipText: 'This hotel has a Global Sustainable Tourism Council recognised certification',
                        groupCode: FilterGroupCodes.Facilities,
                    },
                ],
                groupCode: FilterGroupCodes.Facilities,
            },
        ] as IFilterOption[],
    },
    {
        code: FilterGroupCodes.TripAdvisorRating,
        name: FilterGroupCodes.TripAdvisorRating,
        options: [
            {
                code: '1',
                name: '1 star & up',
                count: 1191,
                groupCode: FilterGroupCodes.TripAdvisorRating,
            },
            {
                code: '2',
                name: '2 stars & up',
                count: 1191,
                groupCode: FilterGroupCodes.TripAdvisorRating,
            },
            {
                code: '3',
                name: '3 stars & up',
                count: 1190,
                groupCode: FilterGroupCodes.TripAdvisorRating,
            },
            {
                code: '4',
                name: '4 stars & up',
                count: 1129,
                groupCode: FilterGroupCodes.TripAdvisorRating,
            },
            {
                code: '5',
                name: '5 stars only',
                count: 67,
                groupCode: FilterGroupCodes.TripAdvisorRating,
            },
        ],
    },
    {
        code: FilterGroupCodes.Offers,
        name: FilterGroupCodes.Offers,
        options: [
            {
                code: 'ffk',
                name: 'Only Free Child Places',
                count: 0,
                groupCode: FilterGroupCodes.Offers,
            },
            {
                code: 'minds',
                name: 'Holidays with over £200 off',
                count: 8,
                groupCode: FilterGroupCodes.Offers,
            },
            {
                code: 'maxds',
                name: 'Holidays with up to £100 off',
                count: 310,
                groupCode: FilterGroupCodes.Offers,
            },
        ],
    },
];
