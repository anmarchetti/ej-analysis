import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import SEOLinksTabs, { TSEOLinksTabsProps } from './SEOLinksTabs';

expect.extend(toHaveNoViolations);

jest.mock('frontend/components/common/TabComponent/TabComponent', () => ({
    __esModule: true,
    default: () => <div data-tid='tab-component' />,
}));

let mockProps;
const createMockProps = (): TSEOLinksTabsProps => ({
    fields: {
        items: [
            {
                Title: mockSitecoreField('title'),
                Links: [
                    {
                        Id: 'id',
                        Name: 'name',
                        Url: 'url',
                    },
                ],
            },
        ],
    },
    params: {},
    rendering: {},
});

describe('SEOLinksTabs', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should pass accessibility', async () => {
        const { container } = render(<SEOLinksTabs {...mockProps} />);

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('should not render component when no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<SEOLinksTabs {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render component when no items', () => {
        mockProps.fields.items = [];
        const { container } = render(<SEOLinksTabs {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render content', () => {
        render(<SEOLinksTabs {...mockProps} />);

        expect(screen.getByTestId('tab-component')).toBeInTheDocument();
    });
});
