import { IDestination } from 'models/data/IDestination';
import { MarketCode } from 'models/data/MarketSettings';
import { DestinationType } from 'models/enum/DestinationType';

export const destinationTour = {
    id: 'id',
    displayName: 'destinationTour_name',
    fields: {
        Image: { value: { src: 'Image' } },
        Name: { value: 'Name' },
        Description: { value: 'Description' },
        TotalDistance: { value: 'TotalDistance' },
        Duration: { value: 'Duration' },
        CentralPointLatidiute: { value: 'CentralPointLatidiute' },
        CentralPointLongitude: { value: 'CentralPointLongitude' },
        Zoom: { value: 3 },
    },
    children: [
        {
            id: 'children-id',
            displayName: 'children_displayName',
            fields: {
                Image: { value: { src: 'children_Image' } },
                Name: { value: 'children_Name' },
                Description: { value: 'children_Description' },
                TotalDistance: { value: 'children_TotalDistance' },
                Duration: { value: 'children_Duration' },
                CentralPointLatidiute: { value: 'children_CentralPointLatidiute' },
                CentralPointLongitude: { value: 'children_CentralPointLongitude' },
                Zoom: { value: 3 },
            },
            children: [],
        },
    ],
};

export const destinationMock: IDestination = {
    code: 'destination_code',
    name: 'destination_name',
    type: DestinationType.Country,
    available: true,
    showOnSearchPod: true,
    relatedRegions: ['Shwabra', 'Manchester', 'United'],
    giataCode: 'giataCode',
    parents: [
        {
            code: 'destination_parent_code',
            name: 'destination_parent_name',
            type: DestinationType.Anywhere,
            available: true,
            showOnSearchPod: true,
            relatedRegions: ['Shwabra', 'Manchester', 'United'],
            giataCode: 'giataCod_parent',
        },
    ],
    children: [
        {
            code: 'destination_child_code',
            name: 'destination_child_name',
            type: DestinationType.Anywhere,
            available: true,
            showOnSearchPod: true,
            relatedRegions: ['Shwabra', 'Manchester', 'United'],
            giataCode: 'giataCod_child',
        },
    ],
    originCountry: {
        code: MarketCode.UK,
        name: 'originCountry_name',
    },
};

export const destinationHotelMock: IDestination = {
    code: 'destination_code',
    name: 'destination_name',
    type: DestinationType.Hotel,
    available: true,
    showOnSearchPod: true,
    giataCode: 'giataCode',
    parents: [
        { name: 'country-name', code: 'region-code', type: DestinationType.Region },
        { name: 'country-name', code: 'country-code', type: DestinationType.Country },
    ],
};

export const destinationVirtualCountryMock: IDestination = {
    code: 'GBSCED',
    itemName: 'Edinburgh City',
    name: 'Edinburgh City',
    parents: [
        {
            code: 'VGBSC',
            itemName: 'Scotland',
            name: 'Scotland',
            type: DestinationType.VirtualCountry,
            relatedRegions: ['GBSC'],
            parents: [
                {
                    code: 'GB',
                    itemName: 'United Kingdom',
                    name: 'United Kingdom',
                    type: DestinationType.Country,
                },
            ],
        },
    ],
    type: DestinationType.Resort,
};

export const destinationRegionMock: IDestination = {
    code: 'MAAG',
    itemName: 'Agadir',
    name: 'Agadir',
    parents: [
        {
            code: 'MA',
            itemName: 'Morocco',
            name: 'Morocco',
            type: DestinationType.Country,
        },
    ],
    type: DestinationType.Region,
};
