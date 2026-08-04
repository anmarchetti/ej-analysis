import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ICarouselTile } from 'frontend/components/renderings/TilesCarousel/TilesCarouselInterfaces';

import TextOnImageTile from './TextOnImageTile';

const createProps = (): ICarouselTile => ({
    Description: mockSitecoreField('description'),
    Subtitle: mockSitecoreField('subtitle'),
    Title: mockSitecoreField('title'),
    Image: mockSitecoreField(mockSitecoreImageField('src')),
});

let mockProps: ICarouselTile;

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='text'>{field.value}</div>,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='rich-text-with-links'>{field.value}</div>,
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

describe('<TextOnImageTile />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render image, title, subtitle and description', () => {
        render(<TextOnImageTile {...mockProps} />);

        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByText('subtitle')).toBeInTheDocument();
        expect(screen.getByText('description')).toBeInTheDocument();
        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith({
            field: mockProps.Image,
            className: 'image',
            ['data-tid']: 'text-on-image-tile-image',
        });
    });
});
