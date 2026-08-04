import React from 'react';
import { render, screen } from '@testing-library/react';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { mockPriceSummaryPlaceholders } from 'frontend/components/renderings/PriceSummary/__mocks__/mockPriceSummaryFields.mocks';

import { ExportButton } from './ExportButton';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Placeholder: ({ name }) => <div data-tid={`placeholder-${name}`} />,
}));

describe('ExportButton', () => {
    it('should render the Placeholder when rendering is provided', () => {
        const renderingMock = {
            componentName: 'PriceSummary',
            placeholders: mockPriceSummaryPlaceholders,
        };

        render(<ExportButton rendering={renderingMock} />);
        expect(screen.getByTestId(`placeholder-${PlaceholderNames.ExportHolidayDetails}`)).toBeInTheDocument();
    });

    it('should not render the Placeholder when rendering is not provided', () => {
        render(<ExportButton />);
        expect(screen.queryByTestId(`placeholder-${PlaceholderNames.ExportHolidayDetails}`)).not.toBeInTheDocument();
    });
});
