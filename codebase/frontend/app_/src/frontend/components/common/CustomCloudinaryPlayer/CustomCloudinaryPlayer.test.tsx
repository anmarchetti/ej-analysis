import React from 'react';
import { render, screen } from '@testing-library/react';

import CloudinaryPlayer, { ICloudinaryPlayerProps } from './CustomCloudinaryPlayer';
import type { IUseCloudinaryPlayerData } from './CustomCloudinaryPlayer.utils';

const mockThumbnailImageComponent = jest.fn();
jest.mock('frontend/components/common/VideoThumbnailImage/VideoThumbnailImage', () => props => {
    mockThumbnailImageComponent(props);

    return <div data-tid='thumbnail' />;
});

const mockUseCloudinaryPlayer = jest.fn(p => p);
jest.mock('./CustomCloudinaryPlayer.utils', () => ({
    __esModule: true,
    default: params => mockUseCloudinaryPlayer(params),
}));

let mockProps: ICloudinaryPlayerProps;

describe('<CustomCloudinaryPlayer />', () => {
    beforeEach(() => {
        mockProps = {
            cloudinaryVideoSrc: 'video-src',
            isBasicPreview: false,
            fallbackImage: 'fallback-image',
            isDisplayed: true,
            thumbnailClassName: 'thumbnail-class',
            videoClassName: 'video-class',
            videoPlaceholder: 'video-placeholder',
            setAutoPlay: jest.fn(),
            autoPlay: false,
        };
    });

    it('should NOT render anything when cloudinaryVideoSrc is not provided', () => {
        mockProps.cloudinaryVideoSrc = '';

        const { container } = render(<CloudinaryPlayer {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render preview when isPreviewShown is true', () => {
        const preview = {
            onClick: jest.fn(),
            showPlayButton: true,
            videoPlaceholder: mockProps.videoPlaceholder,
            fallbackImage: mockProps.fallbackImage as string,
            publicId: mockProps.cloudinaryVideoSrc,
        };

        mockUseCloudinaryPlayer.mockReturnValueOnce({
            preview: { isPreviewShown: true, ...preview },
            player: {} as IUseCloudinaryPlayerData['player'],
        });

        render(<CloudinaryPlayer {...mockProps} />);

        expect(screen.getByTestId('thumbnail')).toBeInTheDocument();
        expect(mockThumbnailImageComponent).toHaveBeenCalledWith({
            ...preview,
            className: 'thumbnail thumbnail-class',
        });
    });

    it('should NOT render preview when isPreviewShown is false', () => {
        mockUseCloudinaryPlayer.mockReturnValueOnce({
            preview: { isPreviewShown: false },
            player: {},
        } as IUseCloudinaryPlayerData);

        render(<CloudinaryPlayer {...mockProps} />);

        expect(screen.queryByTestId('thumbnail')).not.toBeInTheDocument();
    });

    it('should render player when isPlayerShown is true', () => {
        const player = {
            onCanPlay: jest.fn(),
            onEnded: jest.fn(),
            playerRef: { current: null },
        };

        mockUseCloudinaryPlayer.mockReturnValueOnce({
            preview: {} as IUseCloudinaryPlayerData['preview'],
            player: { isPlayerShown: true, ...player },
        });

        const { container } = render(<CloudinaryPlayer {...mockProps} />);

        expect(container.getElementsByClassName('video-class')[0]).toBeInTheDocument();
    });

    it('should NOT render player when isPlayerShown is false', () => {
        mockUseCloudinaryPlayer.mockReturnValueOnce({
            preview: {},
            player: { isPlayerShown: false },
        } as IUseCloudinaryPlayerData);

        render(<CloudinaryPlayer {...mockProps} />);

        expect(screen.queryByTestId('video')).not.toBeInTheDocument();
    });
});
