import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IPromoBlockProps } from 'models/data/IPromoBlockFields';

import { LinkTileWithBorder } from './LinkTileWithBorder';

const mockSitecoreJssText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: props => {
        mockSitecoreJssText(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    JSSImage: props => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockRouterLink = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLink(props);

        return (
            <div data-tid='router-link' onClick={props.onClick}>
                {props.children}
            </div>
        );
    },
}));

const mockTrackItemClick = jest.fn();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ trackItemClick: mockTrackItemClick }),
}));

const createProps = (): IPromoBlockProps =>
    ({
        items: [
            {
                fields: {
                    Description: mockSitecoreField('Description'),
                    Image: mockSitecoreField(mockSitecoreImageField('Image')),
                    Link: mockSitecoreField(mockSitecoreLinkField('Link')),
                    Title: mockSitecoreField('Title'),
                },
                id: '1',
            },
            {
                fields: {
                    Description: mockSitecoreField('Description 2'),
                    Image: mockSitecoreField(mockSitecoreImageField('Image 2')),
                    Link: mockSitecoreField(mockSitecoreLinkField('Link 2')),
                    Title: mockSitecoreField('Title 2'),
                },
                id: '2',
            },
        ],
    } as IPromoBlockProps);

let mockProps = createProps();

describe('<IconTextBlocks />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render nothing if items array is empty', () => {
        mockProps.items = [];

        const { container } = render(<LinkTileWithBorder {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render an item with title, image, description but NOT with link', () => {
        mockProps.items[0].fields.Link = mockSitecoreField(mockSitecoreLinkField(''));
        mockProps.items[1].fields.Link = mockSitecoreField(mockSitecoreLinkField(''));
        render(<LinkTileWithBorder {...mockProps} />);

        expect(screen.queryAllByTestId('router-link')).toHaveLength(0);
        expect(mockRouterLink).not.toHaveBeenCalled();

        expect(screen.getAllByTestId('jss-image')).toHaveLength(2);
        expect(screen.getAllByTestId('sitecore-jss-text')).toHaveLength(2);
        expect(screen.getAllByTestId('rich-text-with-links')).toHaveLength(2);
    });

    it('should render an item with title, image, description and link', () => {
        render(<LinkTileWithBorder {...mockProps} />);

        expect(screen.getAllByTestId('router-link')).toHaveLength(2);
        expect(mockRouterLink).toHaveBeenNthCalledWith(1, {
            link: mockProps.items[0].fields.Link,
            className: 'tile',
            dataId: 'link-tile',
            children: expect.anything(),
            onClick: expect.any(Function),
        });

        expect(mockRouterLink).toHaveBeenNthCalledWith(2, {
            link: mockProps.items[1].fields.Link,
            className: 'tile',
            dataId: 'link-tile',
            children: expect.anything(),
            onClick: expect.any(Function),
        });

        expect(screen.getAllByTestId('jss-image')).toHaveLength(2);
        expect(mockJSSImage).toHaveBeenNthCalledWith(1, {
            field: mockProps.items[0].fields.Image,
            className: 'icon',
            dataTid: 'icon',
        });
        expect(mockJSSImage).toHaveBeenNthCalledWith(2, {
            field: mockProps.items[1].fields.Image,
            className: 'icon',
            dataTid: 'icon',
        });

        expect(screen.getAllByTestId('sitecore-jss-text')).toHaveLength(2);
        expect(mockSitecoreJssText).toHaveBeenNthCalledWith(1, {
            field: mockProps.items[0].fields.Title,
            tag: 'h3',
            className: 'title',
            'data-tid': 'title',
        });
        expect(mockSitecoreJssText).toHaveBeenNthCalledWith(2, {
            field: mockProps.items[1].fields.Title,
            tag: 'h3',
            className: 'title',
            'data-tid': 'title',
        });

        expect(screen.getAllByTestId('rich-text-with-links')).toHaveLength(2);
        expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(1, {
            tag: 'div',
            field: mockProps.items[0].fields.Description,
            className: 'description',
            dataId: 'description',
        });
        expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(2, {
            tag: 'div',
            field: mockProps.items[1].fields.Description,
            className: 'description',
            dataId: 'description',
        });
    });

    it('should call trackItemClick with correct item when link is clicked', async () => {
        render(<LinkTileWithBorder {...mockProps} />);

        await userEvent.click(screen.getAllByTestId('router-link')[0]);

        expect(mockTrackItemClick).toHaveBeenNthCalledWith(1, mockProps.items[0]);
    });
});
