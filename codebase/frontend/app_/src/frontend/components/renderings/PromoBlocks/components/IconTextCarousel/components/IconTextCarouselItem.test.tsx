import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { IconTextCarouselIconAlignment } from 'models/enum/PromoBlocksIconTextCarouselVariantParams';

import IconTextCarouselItem, { IIconTextCarouselItemProps } from './IconTextCarouselItem';

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

const mockRouterLink = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLink(props);

        return <div data-tid='router-link' onClick={props.onClick} />;
    },
}));

const mockTrackItemClick = jest.fn();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ trackItemClick: mockTrackItemClick }),
}));

const createProps = (): IIconTextCarouselItemProps => ({
    item: {
        fields: {
            Title: mockSitecoreField('Title'),
            Image: mockSitecoreField(mockSitecoreImageField('Image')),
            Description: mockSitecoreField('Description'),
            Link: mockSitecoreField(mockSitecoreLinkField('test-link')),
        },
        id: '1',
    } as IPromoBlockFields,
    titleClassName: 'titleClassName',
});

let mockProps: IIconTextCarouselItemProps;

describe('<IconTextCarouselItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<IconTextCarouselItem {...mockProps} />);

        const titleValue = mockProps.item.fields.Title.value;

        expect(screen.getByTestId('icon-text-carousel-item')).toBeInTheDocument();
        expect(screen.getByTestId('icon-text-carousel-item')).toHaveClass('item');
        expect(mockJSSNextImageProps).toHaveBeenCalledWith({
            field: mockProps.item.fields.Image,
            fill: true,
            mediaSize: MediaSize.Small,
        });
        expect(screen.getByText(titleValue)).toBeInTheDocument();
        expect(screen.getByText(titleValue)).toHaveClass(`title ${mockProps.titleClassName}`);
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.item.fields.Description,
            className: 'description',
        });
        expect(mockRouterLink).toHaveBeenCalledWith({
            link: mockProps.item.fields.Link,
            className: 'link-overlay',
            onClick: expect.any(Function),
        });
    });

    it('should NOT render link if link href is missing', () => {
        mockProps.item = {
            ...mockProps.item,
            fields: {
                ...mockProps.item.fields,
                Link: mockSitecoreField(mockSitecoreLinkField()),
            },
        };

        render(<IconTextCarouselItem {...mockProps} />);

        expect(screen.getByTestId('icon-text-carousel-item')).toBeInTheDocument();
        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
    });

    describe('shadow', () => {
        it('should not have shadow class when hasShadow is false', () => {
            render(<IconTextCarouselItem {...mockProps} />);

            expect(screen.getByTestId('icon-text-carousel-item')).not.toHaveClass('shadow');
        });

        it('should have shadow class when hasShadow is true', () => {
            mockProps.hasShadow = true;
            render(<IconTextCarouselItem {...mockProps} />);

            expect(screen.getByTestId('icon-text-carousel-item')).toHaveClass('shadow');
        });
    });

    describe('alignment', () => {
        it('should not have iconCenter class when alignment is not Center', () => {
            render(<IconTextCarouselItem {...mockProps} />);

            expect(screen.getByTestId('icon-text-carousel-item')).not.toHaveClass('iconCenter');
        });

        it('should have iconCenter class when alignment is Center', () => {
            mockProps.alignment = IconTextCarouselIconAlignment.Center;
            render(<IconTextCarouselItem {...mockProps} />);

            expect(screen.getByTestId('icon-text-carousel-item')).toHaveClass('iconCenter');
        });
    });

    it('should call trackItemClick when link is clicked', async () => {
        render(<IconTextCarouselItem {...mockProps} />);

        await userEvent.click(screen.getByTestId('router-link'));

        expect(mockTrackItemClick).toHaveBeenNthCalledWith(1, mockProps.item);
    });
});
