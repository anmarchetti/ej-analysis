import { buildGetDirectionsAppleMapsUrl, buildGetDirectionsGoogleMapsUrl, buildGetWhat3WordsUrl } from './map.utils';

const mockCoords = { latitude: '36.855', longitude: '28.2744' };

describe('map.utils', () => {
    describe('buildGetDirectionsGoogleMapsUrl', () => {
        it('should return correct get directions link', () => {
            const result = buildGetDirectionsGoogleMapsUrl(mockCoords);

            expect(result).toEqual('https://www.google.com/maps/dir/?api=1&destination=36.855,28.2744');
        });
    });

    describe('buildGetDirectionsAppleMapsUrl', () => {
        it('should return correct get directions link', () => {
            const result = buildGetDirectionsAppleMapsUrl(mockCoords);

            expect(result).toEqual('https://maps.apple.com/?daddr=36.855,28.2744');
        });
    });

    describe('buildGetWhat3WordsUrl', () => {
        it('should return correct what3words link', () => {
            const what3WordsLocation = 'index.home.raft';
            const result = buildGetWhat3WordsUrl(what3WordsLocation);

            expect(result).toEqual('https://what3words.com/index.home.raft');
        });
    });
});
