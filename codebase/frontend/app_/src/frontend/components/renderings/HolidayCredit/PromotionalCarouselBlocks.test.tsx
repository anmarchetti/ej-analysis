import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IDestinationFields } from 'models/data/IDestinationFields';
import { IModalContentField, IPromoBlockProps } from 'models/data/IPromoBlockFields';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import PromotionalCarouselBlocks from './PromotionalCarouselBlocks';

const createStores = () => ({
    layoutStore: {
        isLivePriceEnabled: true,
        isEditMode: false,
    },
    hotelsStore: {
        getLivePrice: jest.fn().mockResolvedValue([]),
        getLivePriceCodesByCriteria: jest.fn().mockResolvedValue([]),
    },
});

const resetProps = (): ISitecoreComponent<IPromoBlockProps> => ({
    fields: {
        items: [
            {
                id: '2e3dacc4-7af5-4d3e-9fbe-e29dc7d50ac1',
                fields: {
                    Description: mockSitecoreField('description'),
                    Image: mockSitecoreField(mockSitecoreImageField('image')),
                    Link: mockSitecoreField(mockSitecoreLinkField('Link', '/', SitecoreLinkType.Internal)),
                    Title: mockSitecoreField('{destination}'),
                    ModalContent: {} as IModalContentField,
                    LinkedDestination: [
                        {
                            id: 'b29e9681-a2e3-420e-aee0-3ae0af667f16',
                            fields: {
                                Code: mockSitecoreField('GBEN'),
                                Name: mockSitecoreField('Paris'),
                            } as IDestinationFields,
                        },
                    ],
                },
            },
            {
                id: '215d0deb-d5d2-497d-8004-e79dd5ae1bd5',
                fields: {
                    Description: mockSitecoreField('description'),
                    Image: mockSitecoreField(mockSitecoreImageField('image')),
                    Link: mockSitecoreField(mockSitecoreLinkField('Link', '/', SitecoreLinkType.Internal)),
                    Title: mockSitecoreField('London'),
                    ModalContent: {} as IModalContentField,
                    LinkedDestination: [
                        {
                            id: 'b29e9681-a2e3-420e-aee0-3ae0af667f16',
                            fields: {
                                Code: mockSitecoreField('GBEN'),
                            } as IDestinationFields,
                        },
                    ],
                },
            },
        ],
    },
    params: {},
    rendering: {},
});

let mockStores;
let props = resetProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPromotionalCarouselBlocksItem = jest.fn();
jest.mock('./components/PromotionalCarouselBlocksItem', () => props => {
    mockPromotionalCarouselBlocksItem(props);

    return <div data-testid='promotional-carousel-block-item'>{props.item.id}</div>;
});

jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='carousel'>{children}</div>,
}));

describe('<PromotionalCarouselBlocks />', () => {
    beforeEach(() => {
        mockStores = createStores();
        props = resetProps();
    });

    it('should render default', async () => {
        render(<PromotionalCarouselBlocks {...props} />);

        const slider = screen.getByTestId('promo-blocks-slider');
        expect(slider).toBeInTheDocument();

        const slides = await screen.findAllByTestId('promotional-carousel-block-item');
        expect(slides).toHaveLength(2);

        expect(slides[0]).toHaveTextContent(props.fields!.items[0].id);
        expect(slides[1]).toHaveTextContent(props.fields!.items[1].id);
    });

    it('should NOT render and NOT call getLivePrice when isLivePriceEnabled is false', async () => {
        mockStores.layoutStore.isLivePriceEnabled = false;

        render(<PromotionalCarouselBlocks {...props} />);

        const slider = screen.getByTestId('promo-blocks-slider');
        expect(slider).toBeInTheDocument();

        const slides = await screen.findAllByTestId('promotional-carousel-block-item');
        expect(slides).toHaveLength(2);

        expect(mockStores.hotelsStore.getLivePrice).not.toHaveBeenCalled();
    });

    it('should handle getLivePrice returning prices correctly', async () => {
        mockStores.hotelsStore.getLivePriceCodesByCriteria.mockResolvedValue(['PRICE1', 'PRICE2']);
        mockStores.hotelsStore.getLivePrice.mockResolvedValue([
            { code: 'PRICE1', value: 100 },
            { code: 'PRICE2', value: 200 },
        ]);

        render(<PromotionalCarouselBlocks {...props} />);

        await waitFor(() => {
            expect(mockStores.hotelsStore.getLivePriceCodesByCriteria).toHaveBeenCalled();
            expect(mockStores.hotelsStore.getLivePrice).toHaveBeenCalledWith(['PRICE1', 'PRICE2']);
        });
    });

    it('should pass formatted items with replaced tokens to PromoBlocksRenderHelper', () => {
        render(<PromotionalCarouselBlocks {...props} />);

        expect(mockPromotionalCarouselBlocksItem).toHaveBeenCalledWith({
            item: {
                id: '2e3dacc4-7af5-4d3e-9fbe-e29dc7d50ac1',
                fields: {
                    Description: mockSitecoreField('description'),
                    Image: mockSitecoreField(mockSitecoreImageField('image')),
                    Link: mockSitecoreField(mockSitecoreLinkField('Link', '/', SitecoreLinkType.Internal)),
                    Title: mockSitecoreField('Paris'),
                    ModalContent: {},
                    LinkedDestination: [
                        {
                            id: 'b29e9681-a2e3-420e-aee0-3ae0af667f16',
                            fields: {
                                Code: mockSitecoreField('GBEN'),
                                Name: mockSitecoreField('Paris'),
                            },
                        },
                    ],
                },
            },
        });

        expect(mockPromotionalCarouselBlocksItem).toHaveBeenCalledWith({
            item: {
                id: '215d0deb-d5d2-497d-8004-e79dd5ae1bd5',
                fields: {
                    Description: mockSitecoreField('description'),
                    Image: mockSitecoreField(mockSitecoreImageField('image')),
                    Link: mockSitecoreField(mockSitecoreLinkField('Link', '/', SitecoreLinkType.Internal)),
                    Title: mockSitecoreField('London'),
                    ModalContent: {},
                    LinkedDestination: [
                        {
                            id: 'b29e9681-a2e3-420e-aee0-3ae0af667f16',
                            fields: {
                                Code: mockSitecoreField('GBEN'),
                            },
                        },
                    ],
                },
            },
        });
    });
});
