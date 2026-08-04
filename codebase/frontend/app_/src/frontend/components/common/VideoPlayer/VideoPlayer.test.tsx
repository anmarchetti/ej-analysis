import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import VideoPlayer, { IVideoPlayerProps } from './VideoPlayer';

const mockCloudinaryPlayerComponent = jest.fn();
jest.mock('frontend/components/common/CustomCloudinaryPlayer/CustomCloudinaryPlayer', () => props => {
    mockCloudinaryPlayerComponent(props);

    return <div data-tid='cloudinary-player' />;
});

const mockYoutubePlayerComponent = jest.fn();
jest.mock('frontend/components/common/CustomYoutubePlayer/CustomYoutubePlayer', () => props => {
    mockYoutubePlayerComponent(props);

    return <div data-tid='youtube-player' />;
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
let mockProps: IVideoPlayerProps;

describe('<VideoPlayer />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                isCloudinaryDisabled: false,
            },
        });
        mockProps = {
            fallbackImage: 'fallback-image',
            isBasicPreview: false,
            isDisplayed: true,
            cloudinaryVideoSrc: '',
            id: 'video-id',
            onPlayCallback: jest.fn(),
            thumbnailClassName: 'thumbnail-class',
            title: 'Video Title',
            videoClassName: 'video-class',
            videoPlaceholder: 'video-placeholder',
            wrapperClassName: 'wrapper-class',
            youtubeVideoId: '',
        };
    });

    it('should render CustomCloudinaryPlayer when cloudinaryVideoSrc is provided', () => {
        mockProps.cloudinaryVideoSrc = 'cloudinary-video-src';

        render(<VideoPlayer {...mockProps} />);

        expect(screen.getByTestId('cloudinary-player')).toBeInTheDocument();
        expect(mockCloudinaryPlayerComponent).toHaveBeenCalledWith({
            cloudinaryVideoSrc: 'cloudinary-video-src',
            fallbackImage: 'fallback-image',
            id: 'video-id',
            isBasicPreview: false,
            isDisplayed: true,
            onPlayCallback: expect.any(Function),
            thumbnailClassName: 'thumbnail-class',
            title: 'Video Title',
            videoClassName: 'video-class',
            videoPlaceholder: 'video-placeholder',
        });
    });

    it('should NOT render CustomCloudinaryPlayer when isCloudinaryDisabled is true', () => {
        mockStores.layoutStore.isCloudinaryDisabled = true;
        mockProps.cloudinaryVideoSrc = 'cloudinary-video-src';

        render(<VideoPlayer {...mockProps} />);

        expect(screen.queryByTestId('cloudinary-player')).not.toBeInTheDocument();
        expect(mockCloudinaryPlayerComponent).not.toHaveBeenCalled();
    });

    it('should render CustomYoutubePlayer when youtubeVideoId is provided', () => {
        mockProps.youtubeVideoId = 'youtube-video-id';

        render(<VideoPlayer {...mockProps} />);

        expect(screen.getByTestId('youtube-player')).toBeInTheDocument();
        expect(mockYoutubePlayerComponent).toHaveBeenCalledWith({
            fallbackImage: 'fallback-image',
            id: 'video-id',
            isBasicPreview: false,
            isDisplayed: true,
            onPlayCallback: expect.any(Function),
            title: 'Video Title',
            videoClassName: 'video-class',
            videoPlaceholder: 'video-placeholder',
            wrapperClassName: 'wrapper-class',
            youtubeVideoId: 'youtube-video-id',
        });
    });

    it('should return null when neither cloudinaryVideoSrc nor youtubeVideoId is provided', () => {
        const { container } = render(<VideoPlayer {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
