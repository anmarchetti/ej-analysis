import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { getImage } from 'frontend/utils/getImage';
import { IFeaturedFacility } from 'models/data/IFeaturedFacility';
import { ImageSize } from 'models/enum/ImageSize';

import FeaturedFacilitiesItem from './FeaturedFacilitiesItem';

import '@testing-library/jest-dom';

const createProps = () => ({
    item: {
        title: 'Test title',
        description: 'test description',
        image: 'src',
        link: {
            anchor: 'testAnchor',
            linkType: {},
            text: 'testText',
            url: 'url',
            target: 'testTarget',
        },
        externalImage: {},
    } as IFeaturedFacility,
    itemClass: 'itemClass',
    id: 123,
});

jest.mock('frontend/utils/getImage');

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    RichTextWithLinks: ({ field }) => <div>{field?.value}</div>,
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, className, onClick }) => (
        <div className={className} onClick={onClick}>
            RouterLink
            <span>{children}</span>
        </div>
    ),
}));

jest.mock('frontend/components/icons-new/ChevronRight', () => ({
    __esModule: true,
    default: props => <img {...props} data-tid='svg-chevron-right' alt='' />,
}));

describe('<FeaturedFacilitiesItem />', () => {
    let props;

    beforeEach(() => {
        props = createProps();
    });

    it('Should render FeaturedFacilitiesItem', () => {
        render(<FeaturedFacilitiesItem {...props} />);

        expect(screen.getByText('Test title')).toBeInTheDocument();
        expect(screen.getByText('test description')).toBeInTheDocument();
        expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('Should render RichTextWithLinks/RouterLink/Svg if there are description and link', () => {
        render(<FeaturedFacilitiesItem {...props} />);

        expect(screen.getByText('test description')).toBeInTheDocument();
        expect(screen.getByText('RouterLink')).toBeInTheDocument();
        expect(screen.getByTestId('svg-chevron-right')).toBeInTheDocument();
    });

    it('Should get image with special size and external data if there is no image passed', async () => {
        delete props.item.image;
        props.item.externalImage = { id: '12', small: 'small', medium: 'medium', large: 'large', selected: true };

        (getImage as jest.Mock).mockResolvedValue('mocked-url');

        await act(async () => {
            render(<FeaturedFacilitiesItem {...props} />);
        });

        expect(getImage).toBeCalledWith(props.item.externalImage, ImageSize.Medium);
    });

    it('Should update mounted state on mount and unmount', async () => {
        const { unmount } = render(<FeaturedFacilitiesItem {...props} />);

        expect(screen.getByRole('img')).toBeInTheDocument();

        unmount();

        // State check can be done internally if the component modifies DOM elements or makes network calls.
    });

    it('Should call componentDidUpdate and update image when item changes', async () => {
        const prevProps = {
            id: 123,
            item: {
                title: 'Test title',
                description: 'test description',
                image: '',
                link: {
                    anchor: 'testAnchor',
                    linkType: {},
                    text: 'testText',
                    url: 'url',
                    target: 'testTarget',
                },
                externalImage: {},
            } as IFeaturedFacility,
        };
        const newProps = {
            id: 123,
            item: {
                title: 'Test title',
                description: 'test description',
                image: '',
                link: {
                    anchor: 'testAnchor',
                    linkType: {},
                    text: 'testText',
                    url: 'url',
                    target: 'testTarget',
                },
                externalImage: { id: '12', small: 'small', medium: 'medium', large: 'large', selected: true },
            } as IFeaturedFacility,
        };

        (getImage as jest.Mock).mockResolvedValue('mocked-url');

        const { rerender } = render(<FeaturedFacilitiesItem {...prevProps} />);

        await act(async () => {
            rerender(<FeaturedFacilitiesItem {...newProps} />);
        });

        expect(getImage).toBeCalledWith(newProps.item.externalImage, ImageSize.Medium);
    });
});
