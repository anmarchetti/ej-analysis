import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { PackageValidatingOverlay } from './PackageValidatingOverlay';

jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: ({ header }) => <div data-tid='overlay-spinner'>{header}</div>,
}));

const resetMocks = () => ({
    isValidatingPackage: true,
    isNavigationBooking: false,
    isFullMaintenance: false,
    getPhrase: jest.fn(p => p),
});

let mocks;

describe('<PackageValidatingOverlay />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT render when all props disabled', () => {
        mocks.isValidatingPackage = false;

        const { container } = render(<PackageValidatingOverlay {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isFullMaintenance enabled', () => {
        mocks.isFullMaintenance = true;

        const { container } = render(<PackageValidatingOverlay {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        render(<PackageValidatingOverlay {...mocks} />);

        expect(screen.getByTestId('overlay-spinner')).toHaveTextContent(
            SitecoreDictionary.GlobalsLabelsValidatingPackage,
        );
    });
});
