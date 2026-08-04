import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { getImage } from 'frontend/utils/getImage';
import { ImageSize } from 'models/enum/ImageSize';

import { FeaturedFacility } from './FeaturedFacility';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Text: jest.fn(({ field, 'data-tid': dataTid }) => <p data-tid={dataTid || 'mock-text'}>{field?.value}</p>),
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    JSSImage: jest.fn(({ field, 'data-tid': dataTid }) => (
        <img
            data-tid={dataTid || 'mock-jssimage'}
            src={field?.value?.src || 'mock-src'}
            alt={field?.value?.alt || 'mock-alt'}
        />
    )),
}));

jest.mock('frontend/components/common/RichTextWithLinks', () =>
    jest.fn(({ field }) => <div data-tid={'mock-richtext'}>{field?.value}</div>),
);

jest.mock('frontend/components/common/RouterLink', () =>
    jest.fn(({ link, 'data-tid': dataTid }) => (
        <a href={link?.value?.href} data-tid={dataTid || 'mock-routerlink'}>
            {link?.value?.text || 'Mock Link'}
        </a>
    )),
);

jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: jest.fn((src, params) => `mock-cms-media-url/${src}?params=${JSON.stringify(params)}`),
    },
}));

jest.mock('frontend/utils/getImage');

jest.mock('models/data/MediaSizeParams', () => ({
    getMediaSizeParams: jest.fn(size => ({ size })),
    MediaSize: { Medium: 'mockMediaSizeMedium' },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: ({ field }) => <div data-tid='sitecore-text'>{field.value}</div>,
}));

let mockShouldRenderPromoBlock = true;
jest.mock('frontend/components/renderings/PromoBlocks/PromoBlocks.utils', () => ({
    shouldRenderPromoBlock: jest.fn(() => mockShouldRenderPromoBlock),
}));

const createStores = () => ({
    layoutStore: {
        isEditMode: false,
    },
});

const createProps = () => ({
    itemClass: '',
    item: {
        fields: {
            Title: { value: 'title' },
            Description: { value: 'description' },
            Image: { value: { src: 'test' } },
            Link: {
                value: { href: 'test' },
            },
            Small: { value: 'smallimageurl' },
            Medium: { value: 'mediumimageurl' },
            Large: { value: 'largeimageurl' },
        },
        id: 'test',
    } as any,
});

let mockStores;
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FeaturedFacility />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
        mockShouldRenderPromoBlock = true;
    });

    it('should render null if shouldRenderPromoBlockMock returns false', () => {
        mockShouldRenderPromoBlock = false;
        const { container } = render(<FeaturedFacility {...props} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render the main component if conditions to render null are not met', () => {
        render(<FeaturedFacility {...props} />);

        expect(screen.getByTestId('featured-facility')).toBeInTheDocument();
    });

    describe('Content Rendering (Non-Edit Mode)', () => {
        it('should render background with image URL from Sitecore image if available', async () => {
            render(<FeaturedFacility {...props} />);

            const featuredFacility = await screen.findByTestId('featured-facility');
            const backgroundDiv = featuredFacility.querySelector('div');

            expect(backgroundDiv).toBeInTheDocument();
            await waitFor(() => {
                expect(backgroundDiv).toHaveStyle(`background-image: url()`);
            });
            expect(getImage).not.toHaveBeenCalled();
        });

        it('should render background with image URL from getImage if Sitecore image is not available', async () => {
            const asyncImageUrl = 'async-fallback-image.jpg';
            props.item = {
                ...props.item,
                fields: {
                    ...props.item.fields,
                    Image: { value: { src: '' } },
                    Small: { value: 'small-img.jpg' },
                    Medium: { value: 'medium-img.jpg' },
                    Large: { value: 'large-img.jpg' },
                },
            };
            (getImage as jest.Mock).mockResolvedValue(asyncImageUrl);

            render(<FeaturedFacility {...props} />);

            const featuredFacility = await screen.findByTestId('featured-facility');
            const backgroundDiv = featuredFacility.querySelector('div');

            expect(backgroundDiv).toBeInTheDocument();
            await waitFor(() => {
                expect(backgroundDiv).toHaveStyle(`background-image: url(${asyncImageUrl})`);
            });
            expect(getImage).toHaveBeenCalledWith(
                {
                    small: 'small-img.jpg',
                    medium: 'medium-img.jpg',
                    large: 'large-img.jpg',
                },
                ImageSize.Medium,
            );
            expect(require('code/endpoints').cmsUrls.media).not.toHaveBeenCalled();
        });

        it('should render Title using Text component', () => {
            render(<FeaturedFacility {...props} />);

            const title = screen.getByTestId('sitecore-text');

            expect(title).toBeInTheDocument();
            expect(title).toHaveTextContent('title');
        });

        it('should render Description using RichTextWithLinks if description exists', () => {
            render(<FeaturedFacility {...props} />);

            const description = screen.getByTestId('mock-richtext');

            expect(description).toBeInTheDocument();
            expect(description).toHaveTextContent('description');
        });

        it('should NOT render Description if description does not exist and not in edit mode', () => {
            props.item = {
                ...props.item,
                fields: {
                    ...props.item.fields,
                    Description: { value: '' },
                },
            };

            render(<FeaturedFacility {...props} />);

            expect(screen.queryByTestId('description-richtext-content')).not.toBeInTheDocument();
        });

        it('should render RouterLink if link href exists', () => {
            render(<FeaturedFacility {...props} />);

            const link = screen.getByTestId('mock-routerlink') as HTMLAnchorElement;

            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', 'test');
        });

        it('should NOT render RouterLink if link href does not exist', () => {
            props.item = {
                ...props.item,
                fields: {
                    ...props.item.fields,
                    Link: { value: { href: '' } },
                },
            };

            render(<FeaturedFacility {...props} />);

            expect(screen.queryByTestId('routerlink-content')).not.toBeInTheDocument();
        });
    });
});
