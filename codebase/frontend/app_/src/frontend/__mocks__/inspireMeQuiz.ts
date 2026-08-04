import { IHolidayInspirationOffer, IQuizResult, IRecommendedInspireData } from 'models/data/IHolidayInspiration';

export const mockGetQuizResultParams: IQuizResult = {
    departure: 'LGW,LTN,SEN,STN',
    tags: 'TGPRTNR,THMBH,VBFML',
    weather: 'WWS',
    from: '2024-09-09',
    to: '2024-09-13',
    flexibleDays: 2,
    dates: [
        {
            from: '2024-06-01',
            to: '2024-06-30',
        },
    ],
};

export const mockDefaultGetQuizResultParams: IQuizResult = {
    departure: '',
    from: '',
    tags: undefined,
    to: '',
    weather: '',
    flexibleDays: undefined,
    dates: [],
};

export const destinationOffers: IHolidayInspirationOffer[] = [
    {
        code: 'ESBA',
        name: 'Barcelona',
        description: 'description',
        imageUrl: 'imageUrl',
        url: 'url',
    },
];

export const inspireRecommendationResponse: IRecommendedInspireData = {
    destinations: destinationOffers,
    trackingInfo: {
        pToken: 'pToken',
        recoInfo: {
            placementId: 'ejh-inspire-me',
            modelId: 'modelId',
            strategy: 'strategy',
        },
        apiUrl: 'smartseer-api-шrl',
    },
};
