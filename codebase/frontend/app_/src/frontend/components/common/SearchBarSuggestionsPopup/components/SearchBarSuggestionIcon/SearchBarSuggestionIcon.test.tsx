import { render, screen } from '@testing-library/react';

import { DestinationType } from 'models/enum/DestinationType';
import { HotelTypeIcons } from 'models/enum/HotelTypeIcons';

import SearchBarSuggestionIcon from './SearchBarSuggestionIcon';

jest.mock('frontend/components/icons/Bed', () => ({
    __esModule: true,
    default: () => <svg data-tid='bed' />,
}));

jest.mock('frontend/components/icons/MapMarker', () => ({
    __esModule: true,
    default: () => <svg data-tid='map-marker' />,
}));

jest.mock('frontend/components/icons/MapWithMarker', () => ({
    __esModule: true,
    default: () => <svg data-tid='map-with-marker' />,
}));

jest.mock('frontend/components/icons/PlainDeparture', () => ({
    __esModule: true,
    default: () => <svg data-tid='plain-departure' />,
}));

jest.mock('frontend/components/icons/WorldGlobe', () => ({
    __esModule: true,
    default: () => <svg data-tid='world-globe' />,
}));

jest.mock('frontend/components/icons-new/Luxury', () => ({
    __esModule: true,
    default: () => <svg data-tid='luxury-icon' />,
}));

describe('SearchBarSuggestionsPopup.utils', () => {
    describe('Icons', () => {
        it('should render IconWorldGlobe icon for country DestinationType', () => {
            render(<SearchBarSuggestionIcon type={DestinationType.Country} />);

            expect(screen.getByTestId('world-globe')).toBeInTheDocument();
        });

        it('should render IconWorldGlobe icon for anywhere DestinationType', () => {
            render(<SearchBarSuggestionIcon type={DestinationType.Anywhere} />);

            expect(screen.getByTestId('world-globe')).toBeInTheDocument();
        });

        it('should render IconMapMarker icon for region DestinationType', () => {
            render(<SearchBarSuggestionIcon type={DestinationType.Region} />);

            expect(screen.getByTestId('map-marker')).toBeInTheDocument();
        });

        it('should render IconMapMarker icon for virtualCountry DestinationType', () => {
            render(<SearchBarSuggestionIcon type={DestinationType.VirtualCountry} />);

            expect(screen.getByTestId('map-marker')).toBeInTheDocument();
        });

        it('should render IconMapMarker icon for virtualRegion DestinationType', () => {
            render(<SearchBarSuggestionIcon type={DestinationType.VirtualRegion} />);

            expect(screen.getByTestId('map-marker')).toBeInTheDocument();
        });

        it('should render IconMapWithMarker icon for resort DestinationType', () => {
            render(<SearchBarSuggestionIcon type={DestinationType.Resort} />);

            expect(screen.getByTestId('map-with-marker')).toBeInTheDocument();
        });

        it('should render IconMapWithMarker icon for virtual resort DestinationType', () => {
            render(<SearchBarSuggestionIcon type={DestinationType.VirtualResort} />);

            expect(screen.getByTestId('map-with-marker')).toBeInTheDocument();
        });

        it('should render IconBed icon for hotel DestinationType', () => {
            render(<SearchBarSuggestionIcon type={DestinationType.Hotel} />);

            expect(screen.getByTestId('bed')).toBeInTheDocument();
        });

        it('should render IconPlainDeparture icon for airport DestinationType', () => {
            render(<SearchBarSuggestionIcon type={DestinationType.Airport} />);

            expect(screen.getByTestId('plain-departure')).toBeInTheDocument();
        });

        it('should render IconPlainDeparture icon for undefined', () => {
            render(<SearchBarSuggestionIcon />);

            expect(screen.getByTestId('plain-departure')).toBeInTheDocument();
        });

        it('should render SvgLuxury icon when icon is Luxury', () => {
            render(<SearchBarSuggestionIcon type={DestinationType.Hotel} icon={HotelTypeIcons.Luxury} />);

            expect(screen.getByTestId('luxury-icon')).toBeInTheDocument();
        });
    });
});
