import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';

import { ITitleUnderImageBlockProps, TitleUnderImageBlock } from './TitleUnderImageBlock';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='mock-jss-text'>{field?.value}</div>,
}));

jest.mock('frontend/components/common/JSSImage', () =>
    jest.fn((props: { field: { value?: { alt?: string; src?: string } } }) => (
        <img
            data-tid='mock-jss-image'
            src={props.field?.value?.src || 'mock-src'}
            alt={props.field?.value?.alt || 'mock jss image'}
        />
    )),
);

jest.mock('frontend/components/common/RichTextWithLinks', () =>
    jest.fn((props: { field?: { value?: string } }) => (
        <div data-tid='mock-rich-text-with-links'>{props.field?.value || ''}</div>
    )),
);

jest.mock('frontend/components/common/RouterLink', () =>
    jest.fn((props: { link: { value?: { href?: string } }; children?: React.ReactNode; className?: string }) => (
        <a href={props.link?.value?.href || '#'} className={props.className} data-tid='mock-router-link'>
            {props.children}
        </a>
    )),
);

jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: jest.fn((src: string, params: any) => `${src}?mockParams=${JSON.stringify(params)}`),
    },
}));

jest.mock('models/data/MediaSizeParams', () => ({
    getMediaSizeParams: jest.fn(),
    MediaSize: jest.requireActual('models/data/MediaSizeParams').MediaSize,
}));

let mockShouldRenderPromoBlock = true;
jest.mock('frontend/components/renderings/PromoBlocks/PromoBlocks.utils', () => ({
    shouldRenderPromoBlock: jest.fn(() => mockShouldRenderPromoBlock),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMocks = (): ITitleUnderImageBlockProps => ({
    itemClass: 'test-item-class',
    item: {
        fields: {
            Title: mockSitecoreField('title'),
            Description: mockSitecoreField('description'),
            Image: mockSitecoreField(mockSitecoreImageField('test')),
            Link: mockSitecoreField(mockSitecoreLinkField('test')),
        },
        id: 'test',
    } as IPromoBlockFields,
    titleClassName: 'titleClassName',
});

let props: ITitleUnderImageBlockProps;
let mockStores;

describe('<TitleUnderImageBlock />', () => {
    beforeEach(() => {
        props = resetMocks();
        mockStores = createMockStores();
        mockShouldRenderPromoBlock = true;
    });

    it('should render null if shouldRenderPromoBlockMock returns false', () => {
        mockShouldRenderPromoBlock = false;

        const { container } = render(<TitleUnderImageBlock {...props} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render title, description, link, and background image when all fields have values and not in edit mode', () => {
        props.item = {
            fields: {
                Title: mockSitecoreField('Test Title'),
                Description: mockSitecoreField('Test Description'),
                Image: mockSitecoreField(mockSitecoreImageField('test-image-src', 'test-image-alt')),
                Link: mockSitecoreField(mockSitecoreLinkField('test-link-href')),
            },
            id: 'test',
        } as IPromoBlockFields;

        const expectedMediaParams = { mockSizeParam: MediaSize[MediaSize.Medium] };
        (jest.requireMock('models/data/MediaSizeParams').getMediaSizeParams as jest.Mock).mockReturnValue(
            expectedMediaParams,
        );

        const { container } = render(<TitleUnderImageBlock {...props} />);

        const mainDiv = container.querySelector(`.${props.itemClass}`);
        expect(mainDiv).toBeInTheDocument();

        const backgroundDiv = container.querySelector('.background');
        expect(backgroundDiv).toBeInTheDocument();
        expect(backgroundDiv).not.toHaveClass('exp-editor-bg-image');
        expect(backgroundDiv).toHaveStyle(
            `backgroundImage: url(${props.item.fields.Image.value.src}?mockParams=${JSON.stringify(
                expectedMediaParams,
            )})`,
        );

        const titleElement = screen.getByTestId('mock-jss-text');
        expect(titleElement).toBeInTheDocument();
        expect(titleElement).toHaveTextContent('Test Title');

        const descriptionElement = screen.getByTestId('mock-rich-text-with-links');
        expect(descriptionElement).toBeInTheDocument();
        expect(descriptionElement).toHaveTextContent('Test Description');
        expect(jest.requireMock('frontend/components/common/RichTextWithLinks')).toHaveBeenCalledWith(
            expect.objectContaining({ field: props.item.fields.Description }),
            {},
        );

        const linkElement = screen.getByTestId('mock-router-link');
        expect(linkElement).toBeInTheDocument();
        expect(linkElement).toHaveAttribute('href', 'test-link-href');
        expect(jest.requireMock('frontend/components/common/RouterLink')).toHaveBeenCalledWith(
            expect.objectContaining({ link: props.item.fields.Link, className: 'link-overlay' }),
            {},
        );
    });

    it('should NOT render link if link href is missing (and not edit mode)', () => {
        props.item = {
            fields: {
                Title: mockSitecoreField('Test Title'),
                Description: mockSitecoreField('Test Description'),
                Image: mockSitecoreField(mockSitecoreImageField('test-image-src', 'test-image-alt')),
                Link: mockSitecoreField(mockSitecoreLinkField()),
            },
            id: 'test',
        } as IPromoBlockFields;

        render(<TitleUnderImageBlock {...props} />);

        expect(screen.getByTestId('mock-jss-text')).toHaveTextContent(props.item.fields.Title.value);
        expect(screen.getByTestId('mock-rich-text-with-links')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-router-link')).not.toBeInTheDocument();
    });

    it('should NOT render description if description value is missing (and not edit mode)', () => {
        props.item = {
            fields: {
                Title: mockSitecoreField('Test Title'),
                Link: mockSitecoreField(mockSitecoreLinkField('test-link-href')),
            },
            id: 'test',
        } as IPromoBlockFields;

        render(<TitleUnderImageBlock {...props} />);

        expect(screen.getByTestId('mock-jss-text')).toHaveTextContent(props.item.fields.Title.value);
        expect(screen.queryByTestId('mock-rich-text-with-links')).not.toBeInTheDocument();
        expect(screen.getByTestId('mock-router-link')).toBeInTheDocument();
    });

    it('should render RichTextWithLinks in edit mode even if description is empty', () => {
        mockStores.layoutStore.isEditMode = true;
        props.item = {
            fields: {
                Title: mockSitecoreField('Test Title'),
                Description: mockSitecoreField(''),
            },
            id: 'test',
        } as IPromoBlockFields;

        render(<TitleUnderImageBlock {...props} />);

        expect(screen.getByTestId('mock-rich-text-with-links')).toBeInTheDocument();
        expect(jest.requireMock('frontend/components/common/RichTextWithLinks')).toHaveBeenCalledWith(
            expect.objectContaining({ field: props.item.fields.Description }),
            {},
        );
    });

    it('should render JSSImage in background when in edit mode', () => {
        mockStores.layoutStore.isEditMode = true;
        props.item = {
            fields: {
                Title: mockSitecoreField('Test Title'),
                Image: mockSitecoreField(mockSitecoreImageField('/edit.png', 'Edit Image')),
            },
            id: 'test',
        } as IPromoBlockFields;

        const { container } = render(<TitleUnderImageBlock {...props} />);

        const backgroundDiv = container.querySelector('.background');
        expect(backgroundDiv).toBeInTheDocument();
        expect(screen.getByTestId('mock-jss-image')).toBeInTheDocument();
        expect(screen.getByTestId('mock-jss-image')).toHaveAttribute('src', '/edit.png');
        expect(jest.requireMock('frontend/components/common/JSSImage')).toHaveBeenCalledWith(
            expect.objectContaining({ field: props.item.fields.Image }),
            {},
        );
        expect(backgroundDiv).not.toHaveAttribute('style');
    });
});
