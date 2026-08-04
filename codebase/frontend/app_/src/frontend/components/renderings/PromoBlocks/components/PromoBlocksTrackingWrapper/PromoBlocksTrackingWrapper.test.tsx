import React, { useContext } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import {
    IPromoBlocksTrackingWrapperProps,
    PromoBlocksTrackingWrapper,
    TrackingContext,
} from './PromoBlocksTrackingWrapper';

jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    InView: ({ children, onChange }) => (
        <button data-tid='in-view' onClick={onChange}>
            {children}
        </button>
    ),
}));

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: (callback: any) => callback(mockStores),
}));

jest.mock('frontend/utils/url.utils', () => ({
    buildSitecoreLinkFullUrl: jest.fn(() => '/mock-url'),
}));

const personalizedDestinationMock = (title: string, destination: string) => ({
    Title: mockSitecoreField(title),
    LinkedDestination: [{ fields: { Name: mockSitecoreField(destination) } }],
});

const personalizedChildrenMock = () => [
    {
        fields: personalizedDestinationMock('Visit {destination} Paris', 'Paris'),
        id: 'test1',
    },
    {
        fields: personalizedDestinationMock('Explore {destination} London', 'London'),
        id: 'test2',
    },
];

const resetMocks = (): IPromoBlocksTrackingWrapperProps => ({
    theme: PromoBlocksThemes.Big,
    items: [
        {
            fields: {
                Title: mockSitecoreField('title'),
                Description: mockSitecoreField('description'),
                Image: mockSitecoreField(mockSitecoreImageField('test')),
                Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
                ModalContent: {
                    fields: {
                        ModalButtonText: mockSitecoreField('ModalButtonText'),
                        ModalDescription: mockSitecoreField('ModalDescription'),
                        ModalTitle: mockSitecoreField('ModalTitle'),
                    },
                },
            },
            id: 'test',
        },
    ],
    uid: 'b6e7639f-c2ca-4821-b271-dbc5cca84932',
    shouldTrackAsPromoBlocks: true,
});

const createStores = () =>
    createMockStores({
        trackingStore: { trackPromoBlocksImpression: jest.fn(), trackPromoBlockClick: jest.fn() },
        layoutStore: { sitePath: '/ ' },
    });

let mockStores;
let mockProps = resetMocks();

const Consumer = () => {
    const { trackItemClick } = useContext(TrackingContext);

    return <div data-tid='test-child' onClick={() => trackItemClick?.(mockProps.items[0], 'CTA')} />;
};

describe('<PromoBlocksTrackingWrapper />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = resetMocks();
    });

    it('should render default and provide trackItemClick via context', async () => {
        render(
            <PromoBlocksTrackingWrapper {...mockProps}>
                <Consumer />
            </PromoBlocksTrackingWrapper>,
        );

        const child = screen.getByTestId('test-child');

        expect(child).toBeInTheDocument();

        fireEvent.click(child);

        expect(mockStores.trackingStore.trackPromoBlockClick).toHaveBeenCalled();
    });

    it('should track promo block impression when in view', () => {
        render(
            <PromoBlocksTrackingWrapper {...mockProps}>
                <div />
            </PromoBlocksTrackingWrapper>,
        );

        const inView = screen.getByTestId('in-view');

        expect(inView).toBeInTheDocument();

        fireEvent.click(inView);

        expect(mockStores.trackingStore.trackPromoBlocksImpression).toHaveBeenCalled();
    });

    it('should NOT track promo block when shouldTrackAsPromoBlocks is false', () => {
        mockProps.shouldTrackAsPromoBlocks = false;
        render(
            <PromoBlocksTrackingWrapper {...mockProps}>
                <Consumer />
            </PromoBlocksTrackingWrapper>,
        );

        const child = screen.getByTestId('test-child');

        expect(child).toBeInTheDocument();
        expect(screen.queryByTestId('in-view')).not.toBeInTheDocument();

        fireEvent.click(child);

        expect(mockStores.trackingStore.trackPromoBlockClick).not.toHaveBeenCalled();
    });

    it('should track promo block impression with personalized destinations', async () => {
        mockProps.items = personalizedChildrenMock() as IPromoBlockFields[];

        render(
            <PromoBlocksTrackingWrapper {...mockProps}>
                <div />
            </PromoBlocksTrackingWrapper>,
        );

        fireEvent.click(screen.getByTestId('in-view'));

        expect(mockStores.trackingStore.trackPromoBlocksImpression).toHaveBeenCalledWith(
            'b6e7639f-c2ca-4821-b271-dbc5cca84932',
            PromoBlocksThemes.Big,
            'Visit {destination} Paris|Explore {destination} London',
            'null',
        );
    });

    it('should use description as fallback when title is missing', () => {
        const itemWithoutTitle = {
            fields: {
                Title: mockSitecoreField(''),
                Description: mockSitecoreField('<p>Description text</p>'),
                Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
            },
            id: 'test-no-title',
        };

        mockProps.items = [itemWithoutTitle as IPromoBlockFields];

        render(
            <PromoBlocksTrackingWrapper {...mockProps}>
                <Consumer />
            </PromoBlocksTrackingWrapper>,
        );

        fireEvent.click(screen.getByTestId('test-child'));

        expect(mockStores.trackingStore.trackPromoBlocksImpression).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            'Description text', // falls back to extracted description
            expect.anything(),
        );

        expect(mockStores.trackingStore.trackPromoBlockClick).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            'Description text', // description used as fallback
            expect.anything(),
            'CTA',
            expect.anything(),
        );
    });

    it('should use empty string as fallback when title and description are missing', () => {
        const itemWithoutTitle = {
            fields: {
                Title: mockSitecoreField(''),
                Description: mockSitecoreField(''),
                Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
            },
            id: 'test-no-title',
        };

        mockProps.items = [itemWithoutTitle as IPromoBlockFields];

        render(
            <PromoBlocksTrackingWrapper {...mockProps}>
                <Consumer />
            </PromoBlocksTrackingWrapper>,
        );

        fireEvent.click(screen.getByTestId('test-child'));

        expect(mockStores.trackingStore.trackPromoBlocksImpression).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            '', // empty string used as fallback
            expect.anything(),
        );

        expect(mockStores.trackingStore.trackPromoBlockClick).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            '', // empty string used as fallback
            expect.anything(),
            'CTA',
            expect.anything(),
        );
    });

    it('should extract text from HTML description removing styles', () => {
        const itemWithHtmlDescription = {
            fields: {
                Title: mockSitecoreField('Title'),
                Description: mockSitecoreField('<style>body { color: red; }</style><p>Clean text</p>'),
                Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
            },
            id: 'test-html',
        };

        mockProps.items = [itemWithHtmlDescription as IPromoBlockFields];

        render(
            <PromoBlocksTrackingWrapper {...mockProps}>
                <Consumer />
            </PromoBlocksTrackingWrapper>,
        );

        fireEvent.click(screen.getByTestId('test-child'));

        expect(mockStores.trackingStore.trackPromoBlockClick).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            'Title',
            expect.anything(),
            'CTA',
            expect.anything(),
        );
    });

    it('should handle multiple items with mixed title and description presence', () => {
        const items = [
            {
                fields: {
                    Title: mockSitecoreField('First Title'),
                    Description: mockSitecoreField('First Description'),
                    Image: mockSitecoreField(mockSitecoreImageField('test')),
                    Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
                },
                id: 'item-1',
            },
            {
                fields: {
                    Title: mockSitecoreField(''),
                    Description: mockSitecoreField('<p>Second Description</p>'),
                    Image: mockSitecoreField(mockSitecoreImageField('test')),
                    Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
                },
                id: 'item-2',
            },
        ] as IPromoBlockFields[];

        mockProps.items = items;

        render(
            <PromoBlocksTrackingWrapper {...mockProps}>
                <div />
            </PromoBlocksTrackingWrapper>,
        );

        fireEvent.click(screen.getByTestId('in-view'));

        expect(mockStores.trackingStore.trackPromoBlocksImpression).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            'First Title|Second Description',
            expect.anything(),
        );
    });
});
