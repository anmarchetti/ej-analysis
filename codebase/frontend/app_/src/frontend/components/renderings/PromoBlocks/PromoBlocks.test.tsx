import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceTokens } from 'frontend/__mocks__/utils/tokenizer';
import { getLivePriceCriteriaOfPromoBlocks, setLivePricesToPromoBlocks } from 'frontend/utils/livePrice.utils';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { BigVariantTitlePlacementOptions } from 'models/enum/PromoBlocksBigVariantParams';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { PromoBlocks } from './PromoBlocks';

jest.mock('frontend/components/common/RouterLink', () => ({ className }) => (
    <div data-tid='router-link' className={className} />
));

const personalizedDestinationMock = (title: string, destination: string) => ({
    Title: mockSitecoreField(title),
    LinkedDestination: [{ fields: { Name: mockSitecoreField(destination) } }],
});

const personalizedChildrenMock = () => [
    {
        fields: personalizedDestinationMock('Visit {destination}', 'Paris'),
        id: 'test1',
    },
    {
        fields: personalizedDestinationMock('Explore {destination}', 'London'),
        id: 'test2',
    },
];

const mockPromoBlocksRenderHelper = jest.fn();
jest.mock(
    './components/PromoBlocksRenderHelper/PromoBlocksRenderHelper',
    () =>
        ({ trackComponent, handleClickItem, ...restProps }) => {
            mockPromoBlocksRenderHelper(restProps);

            return (
                <div>
                    <div data-tid='promo-blocks-render-helper' onClick={trackComponent}>
                        <div
                            data-tid='promo-blocks-render-helper-item'
                            onClick={() =>
                                handleClickItem(0, {
                                    fields: personalizedDestinationMock('Visit {destination}', 'Paris'),
                                })
                            }
                        />
                    </div>
                </div>
            );
        },
);

const mockPromoBlocksTitleProps = jest.fn();
jest.mock('./components/PromoBlocksTitle/PromoBlocksTitle', () => ({
    __esModule: true,
    default: props => {
        mockPromoBlocksTitleProps(props);

        return <div data-tid='promo-blocks-title' />;
    },
}));

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceTokens: mockReplaceTokens,
    },
}));

const resetMocks = () =>
    ({
        params: {
            Theme: PromoBlocksThemes.Big,
            TitlePlacement: BigVariantTitlePlacementOptions.TitleBelowImage,
            IsLivePriceEnabled: true,
        },
        fields: {
            Children: [
                {
                    fields: {
                        Title: mockSitecoreField('title'),
                        Description: mockSitecoreField('description'),
                        Image: mockSitecoreField(mockSitecoreImageField('test')),
                        Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
                    },
                    id: 'test',
                },
            ],
            EnableNumberOfNights: mockSitecoreField(false),
            EnableTouristTaxGenericTooltip: mockSitecoreField(true),
        },
        rendering: {
            uid: 'b6e7639f-c2ca-4821-b271-dbc5cca84932',
        },
        experiments: [],
    } as any);

const stores = createMockStores({
    hotelsStore: { getLivePrice: jest.fn(() => [1]), getLivePriceCodesByCriteria: jest.fn(() => []) },
    layoutStore: {
        isLivePriceEnabled: true,
        isNumberOfNightsLabelsEnabled: true,
    },
});

let mockStores = createMockStores(stores);
let mockProps = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/livePrice.utils', () => ({
    ...jest.requireActual('frontend/utils/livePrice.utils'),
    setLivePricesToPromoBlocks: jest.fn(items => items),
    getLivePriceCriteriaOfPromoBlocks: jest.fn(),
}));

describe('<PromoBlocks />', () => {
    beforeEach(() => {
        mockStores = createMockStores(stores);
        mockProps = resetMocks();
    });

    it('should NOT render when fields are NOT provided', () => {
        mockProps.fields = undefined;

        const { container } = render(<PromoBlocks {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render default', () => {
        render(<PromoBlocks {...mockProps} />);

        expect(screen.getByTestId('promo-block-wrapper-big-variant')).toBeInTheDocument();
        expect(mockPromoBlocksTitleProps).toHaveBeenCalledWith({
            theme: mockProps.params.Theme,
            rendering: mockProps.rendering,
        });
        expect(mockPromoBlocksRenderHelper).toHaveBeenCalledWith(
            expect.objectContaining({
                items: [
                    {
                        fields: {
                            Description: { value: 'description' },
                            Image: { value: { src: 'test' } },
                            Link: {
                                value: {
                                    href: 'test',
                                    linktype: 'internal',
                                    text: 'link',
                                },
                            },
                            Title: { value: 'title' },
                        },
                        id: 'test',
                    },
                ],
                params: mockProps.params,
                displayNumberOfNights: false,
                Link: mockProps.fields.Link,
                isTouristTaxTooltipShown: mockProps.fields.EnableTouristTaxGenericTooltip?.value,
            }),
        );
    });

    it('should render data-tid based on theme', () => {
        mockProps.params.Theme = PromoBlocksThemes.TextAlt;
        render(<PromoBlocks {...mockProps} />);

        expect(screen.getByTestId('promo-block-wrapper-text-variant-alternative')).toBeInTheDocument();
    });

    describe('loadPrices', () => {
        it('Should call functions after render and rerender', async () => {
            const { rerender } = render(<PromoBlocks {...mockProps} />);
            const expected = [
                {
                    fields: {
                        Title: mockSitecoreField('title'),
                        Description: mockSitecoreField('description'),
                        Image: mockSitecoreField(mockSitecoreImageField('test')),
                        Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
                    },
                    id: 'test',
                },
            ];

            await waitFor(() => expect(getLivePriceCriteriaOfPromoBlocks).toHaveBeenCalledWith(expected));
            expect(setLivePricesToPromoBlocks).toHaveBeenCalledWith(expected, [1]);

            const item = {
                fields: {
                    Title: mockSitecoreField('title'),
                    Description: mockSitecoreField('description'),
                    Image: mockSitecoreField(mockSitecoreImageField('test')),
                    Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
                },
                id: 'test',
            };
            mockProps.fields.Children.push(item);
            rerender(<PromoBlocks {...mockProps} />);
            await waitFor(() => expect(getLivePriceCriteriaOfPromoBlocks).toHaveBeenCalledWith([...expected, item]));
            expect(setLivePricesToPromoBlocks).toHaveBeenCalledWith([...expected, item], [1]);
        });
    });

    describe('formattedItems', () => {
        beforeEach(() => {
            mockProps.fields.Children = personalizedChildrenMock();
        });

        it('should pass formatted items with replaced tokens to PromoBlocksRenderHelper', () => {
            render(<PromoBlocks {...mockProps} />);

            expect(mockPromoBlocksRenderHelper).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: [
                        {
                            fields: {
                                Title: { value: 'Visit {destination} Paris' },
                                LinkedDestination: [{ fields: { Name: { value: 'Paris' } } }],
                            },
                            id: 'test1',
                        },
                        {
                            fields: {
                                Title: { value: 'Explore {destination} London' },
                                LinkedDestination: [{ fields: { Name: { value: 'London' } } }],
                            },
                            id: 'test2',
                        },
                    ],
                }),
            );
        });

        it('should format items correctly when NO destination provided', () => {
            mockProps.fields.Children = [
                {
                    fields: {
                        Title: { value: `Visit` },
                        LinkedDestination: undefined,
                    },
                    id: 'test1',
                },
                {
                    fields: {
                        Title: { value: `Explore Minsk` },
                        LinkedDestination: undefined,
                    },
                    id: 'test2',
                },
            ];

            render(<PromoBlocks {...mockProps} />);

            expect(mockPromoBlocksRenderHelper).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: mockProps.fields.Children,
                }),
            );
        });
    });

    it('should set alternative prop for displayNumberOfNights when isNumberOfNightsLabelsEnabled is false', () => {
        mockStores.layoutStore.isNumberOfNightsLabelsEnabled = false;

        render(<PromoBlocks {...mockProps} />);

        expect(mockPromoBlocksRenderHelper).toHaveBeenCalledWith(
            expect.objectContaining({
                displayNumberOfNights: false,
            }),
        );
    });
});
