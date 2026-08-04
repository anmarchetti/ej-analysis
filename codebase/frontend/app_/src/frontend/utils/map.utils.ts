import { ILocation } from 'frontend/components/common/MapComponent/OldMap/MapDirectionsProptypes';

export const buildGetDirectionsGoogleMapsUrl = ({ latitude, longitude }: ILocation): string =>
    `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

export const buildGetDirectionsAppleMapsUrl = ({ latitude, longitude }: ILocation): string =>
    `https://maps.apple.com/?daddr=${latitude},${longitude}`;

export const buildGetWhat3WordsUrl = (what3WordsLocation: string): string =>
    `https://what3words.com/${what3WordsLocation}`;
