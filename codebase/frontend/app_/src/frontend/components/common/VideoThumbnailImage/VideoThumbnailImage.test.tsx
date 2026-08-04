import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { cmsUrls } from 'code/endpoints';
import { createMockStores } from 'frontend/__mocks__';
import { FALLBACK_IMAGE_URL } from 'frontend/utils/image.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import VideoThumbnailImage, { IVideoThumbnailImageProps } from './VideoThumbnailImage';

jest.mock('frontend/components/icons-new/VideoPlay', () => ({
    __esModule: true,
    default: ({ className }) => <div data-tid='video-play' className={className} />,
}));

const createProps = (): IVideoThumbnailImageProps => ({
    fallbackImage: 'test-fallback',
    youtubeId: 'youtube-id',
    publicId: 'publicId',
    className: 'test-class',
    isSmall: false,
    onClick: jest.fn(),
    showPlayButton: true,
    videoPlaceholder: '',
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isCloudinaryDisabled: false,
        },
    });

let mockStores = createStores();

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<VideoThumbnailImage />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render container with class name from props and fallback image style', () => {
        const { container } = render(<VideoThumbnailImage {...mockProps} />);

        const wrapper = container.getElementsByClassName('test-class')[0];
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveAttribute('style', `background-image: url(${cmsUrls.media('test-fallback')});`);
    });

    it('should render container with FALLBACK_IMAGE_URL', () => {
        mockProps.fallbackImage = undefined;

        const { container } = render(<VideoThumbnailImage {...mockProps} />);

        const wrapper = container.getElementsByClassName('test-class')[0];
        expect(wrapper).toHaveAttribute('style', `background-image: url(${cmsUrls.media(FALLBACK_IMAGE_URL)});`);
    });

    it('should render not disabled button without smallPlayButton class and VideoPlay and NOT render video-thumbnail-transparent-wrapper', () => {
        render(<VideoThumbnailImage {...mockProps} />);

        expect(screen.getByTestId('video-thumbnail-play-icon')).not.toHaveClass('smallPlayButton');
        expect(screen.getByTestId('video-thumbnail-play-icon')).not.toHaveAttribute('disabled');
        expect(screen.getByTestId('video-play')).toBeInTheDocument();
        expect(screen.queryByTestId('video-thumbnail-transparent-wrapper')).not.toBeInTheDocument();
    });

    it('should render video-thumbnail-transparent-wrapper and disabled button with smallPlayButton class and VideoPlay', () => {
        mockProps.isSmall = true;

        render(<VideoThumbnailImage {...mockProps} />);

        const playButton = screen.getByTestId('video-thumbnail-play-icon');

        expect(playButton).toHaveClass('smallPlayButton');
        expect(playButton).toHaveAttribute('disabled');
        expect(playButton).toHaveAttribute('aria-label', SitecoreDictionary.AccessibilityAriaLabelsYoutubePlayButton);
        expect(screen.getByTestId('video-play')).toBeInTheDocument();
        expect(screen.getByTestId('video-thumbnail-transparent-wrapper')).toBeInTheDocument();
    });

    it('should call onClick when click on icon', async () => {
        render(<VideoThumbnailImage {...mockProps} />);

        const icon = screen.getByTestId('video-play');

        await userEvent.click(icon);

        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should render videoPlaceholder when it is provided', () => {
        mockProps.videoPlaceholder = 'videoPlaceholder-image';
        mockProps.publicId = undefined;

        const { container } = render(<VideoThumbnailImage {...mockProps} />);

        const el = container.getElementsByClassName('thumbnailImage')[0];

        expect(el).toHaveAttribute('style', `background-image: url(${cmsUrls.media('videoPlaceholder-image')});`);
    });

    it('should render cloudinary thumbnail when publicId is defined, isCloudinaryDisabled is false and no placeholder', () => {
        mockProps.videoPlaceholder = undefined;

        const { container } = render(<VideoThumbnailImage {...mockProps} />);

        const el = container.getElementsByClassName('thumbnailImage')[0];

        expect(el).toHaveAttribute(
            'style',
            `background-image: url(https://res.cloudinary.com/undefined/video/upload/publicId.jpg);`,
        );
    });

    it('should render youtube thumbnail with videoPlaceholder as background-image when videoPlaceholder and publicId are NOT provided', () => {
        mockProps.videoPlaceholder = undefined;
        mockProps.publicId = undefined;

        const { container } = render(<VideoThumbnailImage {...mockProps} />);

        const el = container.getElementsByClassName('thumbnailImage')[0];

        expect(el).toHaveAttribute(
            'style',
            `background-image: url(https://img.youtube.com/vi/youtube-id/maxresdefault.jpg);`,
        );
    });

    it('should render youtube thumbnail with videoPlaceholder as background-image when isCloudinaryDisabled is true and videoPlaceholder is NOT provided', () => {
        mockProps.videoPlaceholder = undefined;
        mockStores.layoutStore.isCloudinaryDisabled = true;

        const { container } = render(<VideoThumbnailImage {...mockProps} />);

        const el = container.getElementsByClassName('thumbnailImage')[0];

        expect(el).toHaveAttribute(
            'style',
            `background-image: url(https://img.youtube.com/vi/youtube-id/maxresdefault.jpg);`,
        );
    });
});
