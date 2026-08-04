import { MarketCode } from 'models/data/MarketSettings';

export const originsWithNames = [
    {
        name: 'London',
        code: '',
        children: [
            {
                name: 'London Gatwick',
                code: 'LGW',
                itemName: 'London Gatwick',
            },
            {
                name: 'London Luton',
                code: 'LTN',
                itemName: 'London Luton',
            },
            {
                name: 'London Southend',
                code: 'SEN',
                itemName: 'London Southend',
            },
            {
                name: 'London Stansted',
                code: 'STN',
                itemName: 'London Stansted',
            },
        ],
    },
    {
        name: 'Belfast',
        code: '',
        children: [
            {
                name: 'Belfast City',
                code: 'BHD',
            },
            {
                name: 'Belfast International',
                code: 'BFS',
            },
        ],
    },
    {
        name: 'Birmingham',
        code: 'BHX',
    },
    {
        name: 'Bournemouth',
        code: 'BOH',
    },
    {
        name: 'Bristol',
        code: 'BRS',
    },
    {
        name: 'East Midlands',
        code: 'EMA',
    },
    {
        name: 'Jersey',
        code: 'JER',
    },
    {
        name: 'Leeds Bradford',
        code: 'LBA',
    },
    {
        name: 'Liverpool',
        code: 'LPL',
    },
    {
        name: 'Manchester',
        code: 'MAN',
    },
    {
        name: 'Newcastle',
        code: 'NCL',
    },
    {
        name: 'Newquay',
        code: 'NQY',
    },
    {
        name: 'Scotland',
        code: '',
        children: [
            {
                name: 'Aberdeen',
                code: 'ABZ',
            },
            {
                name: 'Edinburgh',
                code: 'EDI',
            },
            {
                name: 'Glasgow',
                code: 'GLA',
            },
            {
                name: 'Inverness',
                code: 'INV',
            },
        ],
    },
    {
        name: 'Southampton',
        code: 'SOU',
    },
    {
        name: 'Lyon',
        code: 'LYS',
        originCountry: {
            code: MarketCode.FR,
            name: 'France',
        },
    },
];
