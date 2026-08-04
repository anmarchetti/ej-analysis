import React from 'react';
import { render, screen } from '@testing-library/react';

import { PromotionalMessagesTypes } from './constants';
import PromotionalMessages, { IPromotionalMessagesProps } from './PromotionalMessages';

let mockStores = {} as any;

const mockPillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/Pill/Pill', () => ({
    __esModule: true,
    default: props => {
        mockPillComponent(props);

        return <div data-tid='pill' />;
    },
}));

jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: ({ imageSrc, filterMatrix }) => (
        <img src={imageSrc || 'placeholder.svg'} data-filter={filterMatrix} alt='mocked-image-with-filter' />
    ),
    SVGFilterMatrix: { Grayscale: 'grayscale-filter', Green: 'green-filter' },
}));

jest.mock('frontend/components/icons-new/BestPrice', () => () => (
    <div data-testid='best-price-icon'>BestPriceIcon</div>
));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PromotionalMessages />', () => {
    const resetMocks = () =>
        ({
            routeDep: {
                depDate: '2021-05-20T06:05:00+00:00',
            },
            offer: {
                deposit: 120,
                hotel: {
                    country: {
                        code: 'ES',
                    },
                },
                date: new Date().toISOString(),
            },
            fields: {
                items: [
                    {
                        id: '1b6919ce-aaae-4665-96cb-42846f091247',
                        name: PromotionalMessagesTypes.Deposit,
                        displayName: 'Deposit',
                        fields: {
                            Color: { value: 'Green' },
                            Description: { value: 'Deposit description' },
                            Icon: { value: { src: 'icon/source' } },
                            Title: { value: 'Book today for {depositPrice}pp refundable deposit' },
                            Tooltip: { value: 'Deposit' },
                            Type: { value: PromotionalMessagesTypes.Deposit },
                        },
                    },
                    {
                        id: '0ecefb28-9fea-4fcf-93a4-d3b8b19137df',
                        name: PromotionalMessagesTypes.WithConfidenceLess28,
                        displayName: 'Holiday With Confidence less than 28',
                        fields: {
                            Color: { value: 'Grey' },
                            Description: { value: 'Holiday With Confidence less than 28 description' },
                            Icon: { value: { src: 'icon/source' } },
                            Title: { value: 'Holiday With Confidence less than 28' },
                            Tooltip: { value: 'Holiday With Confidence less than 28' },
                            Type: { value: PromotionalMessagesTypes.WithConfidenceLess28 },
                        },
                    },
                    {
                        id: 'bfc4ad03-f3f2-44e3-ae52-96be2803b4e5',
                        name: PromotionalMessagesTypes.WithConfidenceMore28,
                        displayName: 'Holiday With Confidence more than 28',
                        fields: {
                            Color: { value: 'Green' },
                            Description: { value: 'Holiday With Confidence more than 28 description' },
                            Icon: { value: { src: 'icon/source' } },
                            Title: { value: 'Holiday With Confidence more than 28' },
                            Tooltip: { value: 'Holiday With Confidence more than 28' },
                            Type: { value: PromotionalMessagesTypes.WithConfidenceMore28 },
                        },
                    },
                    {
                        id: 'red-id',
                        name: PromotionalMessagesTypes.RedPolicyPillLess28,
                        displayName: 'Red Policy Pill Less Than 28',
                        fields: {
                            Color: { value: 'Grey' },
                            Description: { value: 'Red Policy Pill Less Than 28 description' },
                            Icon: { value: { src: 'icon/source' } },
                            Title: { value: 'Red Policy Pill Less Than 28' },
                            Tooltip: { value: 'Red Policy Pill Less Than 28' },
                            Type: { value: PromotionalMessagesTypes.RedPolicyPillLess28 },
                        },
                    },
                    {
                        id: 'amber-id',
                        name: PromotionalMessagesTypes.AmberPolicyPillLess28,
                        displayName: 'Amber Policy Pill Less Than 28',
                        fields: {
                            Color: { value: 'Green' },
                            Description: { value: 'Amber Policy Pill Less Than 28 description' },
                            Icon: { value: { src: 'icon/source' } },
                            Title: { value: 'Amber Policy Pill Less Than 28' },
                            Tooltip: { value: 'Amber Policy Pill Less Than 28' },
                            Type: { value: PromotionalMessagesTypes.AmberPolicyPillLess28 },
                        },
                    },
                ],
            },
        } as IPromotionalMessagesProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();

        mockStores = {
            layoutStore: {
                isPillVisible: jest.fn().mockReturnValue(true),
                lang: 'en',
            },
            marketStore: {
                formatMoney: jest.fn(),
                getDefaultDepositPrice: jest.fn().mockReturnValue('£60'),
            },
        };
    });

    it('should render main wrapper', () => {
        render(<PromotionalMessages {...mocks} />);
        expect(screen.getByTestId('promotional-messages-wrapper')).toBeInTheDocument();
    });

    it('should render two messages', () => {
        const depDate = new Date();
        depDate.setDate(depDate.getDate() + 50);
        mocks.routeDep.depDate = depDate.toDateString();

        render(<PromotionalMessages {...mocks} />);

        expect(screen.getAllByTestId('pill')).toHaveLength(2);
    });

    it('should show only "WithConfidenceLess28" message if < 28 days before departure and no deposit', () => {
        const depDate = new Date();
        depDate.setDate(depDate.getDate() + 27);
        mocks.routeDep.depDate = depDate.toDateString();

        render(<PromotionalMessages {...mocks} />);

        expect(screen.getByTestId('pill')).toBeInTheDocument();
        expect(mockPillComponent).toHaveBeenCalledWith({
            contentClass: 'grayContent',
            icon: expect.any(Object),
            text: 'Holiday With Confidence less than 28',
            title: 'Holiday With Confidence less than 28',
            titleClass: 'grayTitle',
        });
    });

    it('should not render deposit message if deposit is 0', () => {
        const today = new Date(mocks.offer.date);
        const depDate = new Date(today);
        depDate.setDate(today.getDate() + 50);
        mocks.routeDep.depDate = depDate.toISOString();
        mocks.offer.deposit = 0;

        render(<PromotionalMessages {...mocks} />);

        const pills = screen.getAllByTestId('pill');

        expect(pills).toHaveLength(1);
        expect(mockPillComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Holiday With Confidence more than 28',
            }),
        );
        expect(mockPillComponent).not.toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Book today for £60pp refundable deposit',
            }),
        );
    });

    it('should render deposit message if deposit is more than 0', () => {
        const today = new Date(mocks.offer.date);
        const depDate = new Date(today);
        depDate.setDate(today.getDate() + 50);
        mocks.routeDep.depDate = depDate.toISOString();

        render(<PromotionalMessages {...mocks} />);

        const pills = screen.getAllByTestId('pill');

        expect(pills).toHaveLength(2);
        expect(mockPillComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Holiday With Confidence more than 28',
            }),
        );
        expect(mockPillComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Book today for £60pp refundable deposit',
            }),
        );
    });

    it('should render deposit message for current market if offer is NOT shortlisted and deposit is more than 0', () => {
        const today = new Date(mocks.offer.date);
        const depDate = new Date(today);
        depDate.setDate(today.getDate() + 50);
        mocks.routeDep.depDate = depDate.toISOString();
        mockStores.marketStore.getDefaultDepositPrice.mockReturnValue('70CHF');
        mockStores.layoutStore.lang = 'de-CH';

        render(<PromotionalMessages {...mocks} />);

        const pills = screen.getAllByTestId('pill');

        expect(pills).toHaveLength(2);
        expect(mockPillComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Holiday With Confidence more than 28',
            }),
        );
        expect(mockPillComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Book today for 70CHFpp refundable deposit',
            }),
        );

        expect(mockStores.marketStore.getDefaultDepositPrice).toHaveBeenCalledWith(mockStores.layoutStore.lang);
    });

    it('should render deposit message for different market if offer is shortlisted and deposit is more than 0', () => {
        const today = new Date(mocks.offer.date);
        const depDate = new Date(today);
        depDate.setDate(today.getDate() + 50);
        mocks.routeDep.depDate = depDate.toISOString();
        mockStores.marketStore.getDefaultDepositPrice = jest.fn().mockReturnValue('€70');
        mocks.offer.shortlist = { language: 'fr-FR' };

        render(<PromotionalMessages {...mocks} />);

        const pills = screen.getAllByTestId('pill');

        expect(pills).toHaveLength(2);
        expect(mockPillComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Holiday With Confidence more than 28',
            }),
        );
        expect(mockPillComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Book today for €70pp refundable deposit',
            }),
        );
    });
});
