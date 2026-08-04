import { getVideoId } from './video.utils';

describe('video.utils', () => {
    describe('getVideoId', () => {
        it('should return youtubeId when isCloudinaryDisabled is true', () => {
            expect(getVideoId(true, 'cloudinaryId', 'youtubeId')).toEqual('youtubeId');
        });

        it('should return empty youtubeId when cloudinaryId and youtubeId are NOT provided', () => {
            expect(getVideoId()).toEqual('');
        });

        it('should return cloudinaryId when isCloudinaryDisabled is false and cloudinaryId is provided', () => {
            expect(getVideoId(false, 'cloudinaryId', 'youtubeId')).toEqual('cloudinaryId');
        });
    });
});
