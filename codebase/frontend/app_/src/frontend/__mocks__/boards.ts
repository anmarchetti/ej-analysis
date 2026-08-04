import { IAltBoard } from 'models/data/IOffer';

export const bedBreakfastBoard: IAltBoard = {
    price: 1131,
    pricePP: 566,
    priceExcludingTouristTax: 1121,
    pricePPExcludingTouristTax: 561,
    code: 'BB',
    isExt: false,
    content: '<ul>\n    <li>Breakfast</li>\n</ul>',
    description: 'Breakfast',
    iconUrl: '/-/jssmedia/202d82d5df574cea846c4cb3607cd16b.ashx',
    title: 'Bed and Breakfast',
    roomAlterations: {
        ['test']: 'test2',
    },
};

export const halfBoard: IAltBoard = {
    price: 1445,
    pricePP: 723,
    priceExcludingTouristTax: 1435,
    pricePPExcludingTouristTax: 718,
    code: 'HB',
    isExt: false,
    title: 'Half Board',
    content: '<ul>\n    <li>Breakfast</li>\n    <li>Dinner</li>\n</ul>',
    description: 'Breakfast\r\nDinner',
    iconUrl: '/-/jssmedia/ee09ab1161a34c1e93d08579844d9db0.ashx',
    unitCodes: {
        'JSU.C2!NOR.PVP BB NEW': 'JSU.C2!NOR.PVP HB NEW',
    },
    roomAlterations: {},
};

export const allInclusiveBoard: IAltBoard = {
    price: 1569,
    pricePP: 785,
    priceExcludingTouristTax: 1559,
    pricePPExcludingTouristTax: 780,
    code: 'AI',
    title: 'All Inclusive',
    isExt: false,
    content:
        '<ul>\n    <li>Breakfast</li>\n    <li>Lunch</li>\n    <li>Snacks</li>\n    <li>Dinner</li>\n    <li>Drinks</li>\n</ul>',
    description: 'Breakfast\r\nLunch\r\nSnacks\r\nDinner\r\nDrinks',
    iconUrl: '/-/jssmedia/0c0aa0a2205c410bb93d7129861f2914.ashx',
    unitCodes: {
        'JSU.C2!NOR.PVP BB NEW': 'JSU.C2!NOR.PVP AI NEW',
    },
    roomAlterations: {},
};

export const allInclusivePlusBoard: IAltBoard = {
    price: 1964,
    pricePP: 982,
    priceExcludingTouristTax: 1954,
    pricePPExcludingTouristTax: 977,
    code: 'AI+',
    isExt: false,
    title: 'All inclusive plus',
    content:
        '<ul>\n    <li>Breakfast</li>\n    <li>Lunch</li>\n    <li>Dinner&nbsp;</li>\n    <li>Snacks</li>\n    <li>Drinks&nbsp;</li>\n</ul>',
    description: 'Breakfast\r\nLunch\r\nDinner \r\nSnacks\r\nDrinks ',
    iconUrl: '/-/jssmedia/0c0aa0a2205c410bb93d7129861f2914.ashx',
    unitCodes: {
        'JSU.C2!NOR.PVP BB NEW': 'JSU.C2!NOR.PVP AI PLUS NEW',
    },
    roomAlterations: {},
};

export const allBoards = [bedBreakfastBoard, halfBoard, allInclusiveBoard, allInclusivePlusBoard];
