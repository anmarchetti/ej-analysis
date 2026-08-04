import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { buildGetDirectionsAppleMapsUrl, buildGetDirectionsGoogleMapsUrl } from 'frontend/utils/map.utils';
import itinerarySummaryFieldsMocks from 'frontend/components/renderings/ItinerarySummary/__mocks__/itinerarySummaryFields';

import GetDirectionsPopup, { IGetDirectionsPopupProps } from './GetDirectionsPopup';

expect.extend(toHaveNoViolations);

const createProps = () => {
    const { DirectionsLabel, AppleMapsLabel, GoogleMapsLabel, CloseDrawerLabel, MapsApplicationLabel } =
        itinerarySummaryFieldsMocks;

    return {
        appleMapsLabel: AppleMapsLabel,
        closeDrawerLabel: CloseDrawerLabel,
        directionsLabel: DirectionsLabel,
        googleMapsLabel: GoogleMapsLabel,
        coordinates: { latitude: 'lat', longitude: 'long' },
        mapsApplicationLabel: MapsApplicationLabel,
        onClose: jest.fn(),
    };
};

let props: IGetDirectionsPopupProps;
let mockIsIOS = false;

jest.mock('frontend/utils/browser.utils', () => ({
    __esModule: true,
    isIOS: () => mockIsIOS,
}));

jest.mock('frontend/utils/map.utils', () => ({
    buildGetDirectionsGoogleMapsUrl: jest.fn(),
    buildGetDirectionsAppleMapsUrl: jest.fn(),
}));

const mockWarningPopupProps = jest.fn();
jest.mock('frontend/components/renderings/WarningPopup/WarningPopup', () => ({
    __esModule: true,
    default: ({ extraContent, ...props }) => {
        mockWarningPopupProps(props);

        return <div data-tid='warning-popup'>{extraContent}</div>;
    },
}));

describe('<GetDirectionsPopup />', () => {
    beforeEach(() => {
        props = createProps();
        window.open = jest.fn();
    });

    it('should render and pass correct props to warning popup', () => {
        render(<GetDirectionsPopup {...props} />);

        expect(screen.getByTestId('warning-popup')).toBeInTheDocument();

        expect(mockWarningPopupProps).toHaveBeenCalledWith({
            title: props.directionsLabel,
            description: props.mapsApplicationLabel,
            onClose: props.onClose,
        });
    });

    it('should close get directions popup on clicking close cta', async () => {
        render(<GetDirectionsPopup {...props} />);

        await userEvent.click(screen.getByRole('button', { name: props.closeDrawerLabel.value }));

        expect(props.onClose).toHaveBeenCalled();
    });

    it('should have correct get directions google maps link on mobile', async () => {
        const googleMockedResult = 'google.com';

        (buildGetDirectionsGoogleMapsUrl as jest.Mock).mockReturnValue(googleMockedResult);

        render(<GetDirectionsPopup {...props} />);

        await userEvent.click(screen.getByRole('link', { name: props.googleMapsLabel.value }));

        expect(window.open).toHaveBeenCalledWith(googleMockedResult);
    });

    it('should have correct get directions apple maps link on iPhone', async () => {
        mockIsIOS = true;
        const appleMockedResult = 'apple.com';

        (buildGetDirectionsAppleMapsUrl as jest.Mock).mockReturnValue(appleMockedResult);

        render(<GetDirectionsPopup {...props} />);

        const appleMapsLink = screen.getByRole('link', { name: props.appleMapsLabel.value });

        expect(appleMapsLink).toBeInTheDocument();

        await userEvent.click(appleMapsLink);

        expect(window.open).toHaveBeenCalledWith(appleMockedResult);
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<GetDirectionsPopup {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
