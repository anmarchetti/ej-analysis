import React from 'react';
import { YouTubeEvent } from 'react-youtube';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as utils from 'frontend/utils/cookies.utils';
import { FALLBACK_IMAGE_URL } from 'frontend/utils/image.utils';

import YoutubePlayer, { IYoutubePlayerProps } from './CustomYoutubePlayer';

const createProps = (): IYoutubePlayerProps => ({
    isBasicPreview: true,
    youtubeVideoId: 'id',
    wrapperClassName: 'test-class',
    fallbackImage: 'test-fallback',
    isDisplayed: true,
    videoPlaceholder: 'youtube-video-placeholder',
    onPlayCallback: jest.fn(),
});

const videoPlayerProps = {
    videoId: 'id',
    opts: {
        height: '100%',
        playerVars: {
            rel: 0,
            mute: 1,
        },
        width: '100%',
    },
    className: '',
    title: '',
    onPlay: expect.any(Function),
};

let mockProps;

const mockYouTubeEvent = {
    target: {
        stopVideo: jest.fn(),
        pauseVideo: jest.fn(),
        playVideo: jest.fn(),
    },
} as YouTubeEvent<number>;

const mockYoutubeComponent = jest.fn();
jest.mock('react-youtube', () => ({
    __esModule: true,
    default: ({ onReady, onEnd, ...props }) => {
        mockYoutubeComponent(props);

        return (
            <div
                data-tid='player'
                onClick={() => onReady(mockYouTubeEvent)}
                onMouseEnter={() => onEnd(mockYouTubeEvent)}
            />
        );
    },
}));

const mockYoutubeThumbnailImageComponent = jest.fn();
jest.mock('frontend/components/common/VideoThumbnailImage/VideoThumbnailImage', () => ({
    __esModule: true,
    default: props => {
        const { onClick, fallbackImage } = props;
        mockYoutubeThumbnailImageComponent(props);

        return (
            <div data-tid='youtube-thumbnail-image' onClick={onClick}>
                {fallbackImage}
            </div>
        );
    },
}));

describe('<YoutubePlayer />', () => {
    beforeEach(() => {
        mockProps = createProps();
        jest.spyOn(utils, 'getCookie').mockReturnValue('1');
    });

    it('should NOT render when video ID is NOT provided', () => {
        mockProps.youtubeVideoId = undefined;
        const { container } = render(<YoutubePlayer {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render container with class name provided in props', () => {
        const { container } = render(<YoutubePlayer {...mockProps} />);

        expect(container.getElementsByClassName('test-class').length).toBe(1);
    });

    it('should render player', () => {
        render(<YoutubePlayer {...mockProps} />);

        expect(screen.getByTestId('player')).toBeInTheDocument();
    });

    it('should NOT render player when disabled in cookies', () => {
        jest.spyOn(utils, 'getCookie').mockReturnValue('test');
        render(<YoutubePlayer {...mockProps} />);

        expect(screen.queryByTestId('player')).not.toBeInTheDocument();
    });

    it('should render YoutubeThumnbnailImage with fallbackImage from props', () => {
        render(<YoutubePlayer {...mockProps} />);

        expect(screen.getByTestId('youtube-thumbnail-image')).toHaveTextContent('test-fallback');
    });

    it('YoutubeThumnbnailImage component should receive correct props', () => {
        render(<YoutubePlayer {...mockProps} />);

        expect(mockYoutubeThumbnailImageComponent).toHaveBeenCalledWith({
            fallbackImage: mockProps.fallbackImage,
            youtubeId: mockProps.youtubeVideoId,
            videoPlaceholder: mockProps.videoPlaceholder,
            className: 'thumbnail',
            showPlayButton: false,
            onClick: expect.any(Function),
        });
    });

    it('should render YoutubeThumnbnailImage with FALLBACK_IMAGE_URL when fallbackImage from props is NOT provided', () => {
        mockProps.fallbackImage = undefined;
        render(<YoutubePlayer {...mockProps} />);

        expect(screen.getByTestId('youtube-thumbnail-image')).toHaveTextContent(FALLBACK_IMAGE_URL);
    });

    it('should NOT render YoutubeThumnbnailImage when isBasicPreview is false', () => {
        mockProps.isBasicPreview = false;
        render(<YoutubePlayer {...mockProps} />);

        expect(screen.queryByTestId('youtube-thumbnail-image')).not.toBeInTheDocument();
    });

    it('should NOT render YoutubeThumnbnailImage when isBasicPreview is false', () => {
        mockProps.isBasicPreview = false;
        render(<YoutubePlayer {...mockProps} />);

        expect(screen.queryByTestId('youtube-thumbnail-image')).not.toBeInTheDocument();
    });

    it('should render thumbnail after video ends', async () => {
        videoPlayerProps.className = 'hidden';
        render(<YoutubePlayer {...mockProps} />);

        await userEvent.click(screen.getByTestId('youtube-thumbnail-image'));

        expect(screen.queryByTestId('youtube-thumbnail-image')).not.toBeInTheDocument();

        await userEvent.hover(screen.getByTestId('player'));

        expect(screen.getByTestId('youtube-thumbnail-image')).toBeInTheDocument();
        expect(mockYouTubeEvent.target.stopVideo).toHaveBeenCalled();
        expect(mockYoutubeComponent).toHaveBeenLastCalledWith(videoPlayerProps);
    });

    it('should render youtube component with title from props', () => {
        videoPlayerProps.title = 'test title';
        mockProps.title = 'test title';

        render(<YoutubePlayer {...mockProps} />);

        expect(mockYoutubeComponent).toHaveBeenLastCalledWith(videoPlayerProps);
    });

    it('should pause video when isDisplayed is false', async () => {
        mockProps.isDisplayed = true;

        const { rerender } = render(<YoutubePlayer {...mockProps} />);

        const el = screen.getByTestId('player');
        await userEvent.click(el);

        rerender(<YoutubePlayer {...{ ...mockProps, isDisplayed: false }} />);

        expect(mockYouTubeEvent.target.pauseVideo).toHaveBeenCalled();
    });
});
