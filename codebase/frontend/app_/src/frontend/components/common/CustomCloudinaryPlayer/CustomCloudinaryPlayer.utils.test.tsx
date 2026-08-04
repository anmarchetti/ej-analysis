import React from 'react';
import { renderHook } from '@testing-library/react';

import * as useShouldRenderVideoHooks from 'frontend/hooks/useShouldRenderVideo';

import useCloudinaryPlayer, * as utils from './CustomCloudinaryPlayer.utils';

const mockSource = jest.fn();
const mockOn = jest.fn();
const mockVideojsOn = jest.fn();
jest.mock('cloudinary-video-player', () => ({
    videoPlayer: jest.fn(() => ({
        source: mockSource,
        on: mockOn,
        videojs: {
            on: mockVideojsOn,
        },
    })),
}));

const { initPlayer } = utils;
const initPlayerSpy = jest.spyOn(utils, 'initPlayer');
const useShouldRenderVideoMock = jest.spyOn(useShouldRenderVideoHooks, 'default').mockImplementation(() => true);

describe('CustomCloudinaryPlayer.utils', () => {
    describe('useCloudinaryPlayer', () => {
        it('should return empty object when publicId is not provided', () => {
            const { result } = renderHook(() =>
                useCloudinaryPlayer({
                    isBasicPreview: true,
                    publicId: '',
                }),
            );

            expect(result.current).toStrictEqual({});
        });

        it('should NOT initialize player when cookies are not accepted', async () => {
            useShouldRenderVideoMock.mockImplementationOnce(() => false);

            renderHook(() =>
                useCloudinaryPlayer({
                    isBasicPreview: true,
                    publicId: 'test-video',
                }),
            );

            expect(initPlayerSpy).not.toHaveBeenCalled();
        });

        it('should render preview when isBasicPreview is true', () => {
            const { result } = renderHook(() =>
                useCloudinaryPlayer({
                    isBasicPreview: true,
                    publicId: 'sample-video',
                }),
            );

            expect(result.current.preview?.isPreviewShown).toBe(true);
        });

        it('should NOT render preview and plays video on preview click', () => {
            const mockVideo = { play: jest.fn(), pause: jest.fn() } as unknown as HTMLVideoElement;

            jest.spyOn(React, 'useState')
                .mockReturnValueOnce([true, jest.fn()])
                .mockReturnValueOnce([mockVideo, jest.fn()]);

            const { result } = renderHook(() =>
                useCloudinaryPlayer({
                    isBasicPreview: true,
                    publicId: 'sample-video',
                }),
            );

            result.current.preview?.onClick();

            expect(mockVideo.play).toHaveBeenCalled();
        });

        it('should pause video when isDisplayed is false', () => {
            const mockVideo = { pause: jest.fn() } as unknown as HTMLVideoElement;
            jest.spyOn(React, 'useState')
                .mockReturnValueOnce([false, jest.fn()])
                .mockReturnValueOnce([mockVideo, jest.fn()]);

            renderHook(() =>
                useCloudinaryPlayer({
                    isBasicPreview: false,
                    isDisplayed: false,
                    publicId: 'sample-video',
                }),
            );

            expect(mockVideo.pause).toHaveBeenCalled();
        });

        it('should autoplay video when isDisplayed is true and autoPlay is enabled', () => {
            const mockVideo = { play: jest.fn() } as unknown as HTMLVideoElement;
            const mockSetAutoPlay = jest.fn();

            jest.spyOn(React, 'useState')
                .mockReturnValueOnce([false, jest.fn()])
                .mockReturnValueOnce([mockVideo, jest.fn()]);

            renderHook(() =>
                useCloudinaryPlayer({
                    isBasicPreview: false,
                    isDisplayed: true,
                    autoPlay: true,
                    setAutoPlay: mockSetAutoPlay,
                    publicId: 'sample-video',
                }),
            );

            expect(mockVideo.play).toHaveBeenCalled();
            expect(mockSetAutoPlay).toHaveBeenCalledWith(false);
        });

        it('should return player data when publicId is provided', () => {
            const { result } = renderHook(() =>
                useCloudinaryPlayer({
                    isBasicPreview: false,
                    publicId: 'sample-video',
                    onPlayCallback: jest.fn(),
                }),
            );

            expect(result.current.player).toStrictEqual({
                isPlayerShown: true,
                onEnded: expect.any(Function),
                playerRef: {
                    current: null,
                },
            });
        });
    });

    describe('initPlayer', () => {
        let mockCloudinaryRef;
        let mockPlayerRef;

        beforeEach(() => {
            mockCloudinaryRef = { current: null };
            mockPlayerRef = { current: document.createElement('video') };
        });

        it('should NOT initialize player when cloudinaryRef is already set', async () => {
            mockCloudinaryRef = { current: {} };
            mockPlayerRef = { current: null };

            await initPlayer({
                cloudinaryRef: mockCloudinaryRef,
                playerRef: mockPlayerRef,
                publicId: 'sample-video',
                setVideo: jest.fn(),
                onPlayCallback: jest.fn(),
            });

            expect(mockCloudinaryRef.current).toEqual({});
        });

        it('should imports cloudinary-video-player and initializes player when cloudinaryRef is not set', async () => {
            await initPlayer({
                cloudinaryRef: mockCloudinaryRef,
                playerRef: mockPlayerRef,
                publicId: 'sample-video',
                setVideo: jest.fn(),
                onPlayCallback: jest.fn(),
            });

            expect(mockCloudinaryRef.current).not.toBeNull();
            expect(mockCloudinaryRef.current!.videoPlayer).toHaveBeenCalledWith(mockPlayerRef.current, {
                bigPlayButton: false,
                cloud_name: undefined,
                controls: true,
                muted: true,
                secure: true,
            });
        });

        it('should set video source to publicId after initializing player', async () => {
            await initPlayer({
                cloudinaryRef: mockCloudinaryRef,
                playerRef: mockPlayerRef,
                publicId: 'sample-video',
                setVideo: jest.fn(),
                onPlayCallback: jest.fn(),
            });

            expect(mockSource).toHaveBeenCalledWith('sample-video', {
                transformation: {
                    crop: 'limit',
                    width: 1280,
                    fetch_format: 'auto',
                    quality: 'auto',
                },
            });
        });

        it('should call setVideo with player instance when ready event is triggered', async () => {
            const mockSetVideo = jest.fn();

            await initPlayer({
                cloudinaryRef: mockCloudinaryRef,
                playerRef: mockPlayerRef,
                publicId: 'sample-video',
                setVideo: mockSetVideo,
                onPlayCallback: jest.fn(),
            });

            const readyCallback = mockVideojsOn.mock.calls.find(call => call[0] === 'ready')?.[1];

            if (readyCallback) {
                readyCallback({ target: { player: 'mockPlayer' } });
            }

            expect(mockSetVideo).toHaveBeenCalledWith('mockPlayer');
        });

        it('should call onPlayCallback with player instance when ready event is triggered', async () => {
            const mockOnPlayCallback = jest.fn();

            await initPlayer({
                cloudinaryRef: mockCloudinaryRef,
                playerRef: mockPlayerRef,
                publicId: 'sample-video',
                setVideo: jest.fn(),
                onPlayCallback: mockOnPlayCallback,
            });

            const readyCallback = mockVideojsOn.mock.calls.find(call => call[0] === 'play')?.[1];

            if (readyCallback) {
                readyCallback();
            }

            expect(mockOnPlayCallback).toHaveBeenCalled();
        });

        it('should toggle video playback on touchstart when video is paused', async () => {
            const playMock = jest.fn();
            const pauseMock = jest.fn();

            const videoElement = {
                paused: true,
                play: playMock,
                pause: pauseMock,
            };

            Object.setPrototypeOf(videoElement, HTMLVideoElement.prototype);

            mockOn.mockImplementation((event, callback) => {
                callback({ target: videoElement });
            });

            await initPlayer({
                cloudinaryRef: mockCloudinaryRef,
                playerRef: mockPlayerRef,
                publicId: 'sample-video',
                setVideo: jest.fn(),
                onPlayCallback: jest.fn(),
            });

            expect(playMock).toHaveBeenCalled();
            expect(pauseMock).not.toHaveBeenCalled();
        });

        it('should toggle video playback on touchstart when video is playing', async () => {
            const playMock = jest.fn();
            const pauseMock = jest.fn();

            const videoElement = {
                paused: false,
                play: playMock,
                pause: pauseMock,
            };

            Object.setPrototypeOf(videoElement, HTMLVideoElement.prototype);

            mockOn.mockImplementation((event, callback) => {
                callback({ target: videoElement });
            });

            await initPlayer({
                cloudinaryRef: mockCloudinaryRef,
                playerRef: mockPlayerRef,
                publicId: 'sample-video',
                setVideo: jest.fn(),
                onPlayCallback: jest.fn(),
            });

            expect(pauseMock).toHaveBeenCalled();
            expect(playMock).not.toHaveBeenCalled();
        });

        it('should NOT toggle playback on touchstart when target is not a video element', async () => {
            const playMock = jest.fn();
            const pauseMock = jest.fn();

            const videoElement = {
                paused: false,
                play: playMock,
                pause: pauseMock,
            };

            mockOn.mockImplementation((event, callback) => {
                callback({ target: videoElement });
            });

            await initPlayer({
                cloudinaryRef: mockCloudinaryRef,
                playerRef: mockPlayerRef,
                publicId: 'sample-video',
                setVideo: jest.fn(),
                onPlayCallback: jest.fn(),
            });

            expect(pauseMock).not.toHaveBeenCalled();
            expect(playMock).not.toHaveBeenCalled();
        });
    });
});
