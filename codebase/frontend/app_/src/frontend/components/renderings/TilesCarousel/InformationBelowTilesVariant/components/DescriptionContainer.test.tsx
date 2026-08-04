import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import DescriptionContainer, { IDescriptionContainerProps } from './DescriptionContainer';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='text'>{field.value}</div>,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='rich-text-with-links'>{field.value}</div>,
}));

let mockProps: IDescriptionContainerProps;

describe('<DescriptionContainer />', () => {
    beforeEach(() => {
        mockProps = {
            Description: mockSitecoreField('Description'),
            Subtitle: mockSitecoreField('Subtitle'),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should render subtitle and description', () => {
        render(<DescriptionContainer {...mockProps} />);

        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('Description');
        expect(screen.getByTestId('text')).toHaveTextContent('Subtitle');
    });

    it('should set scrollTop to 0 when selectedIndex is changing', () => {
        const { rerender } = render(<DescriptionContainer {...mockProps} />);

        const container = screen.getByTestId('tiles-carousel-description-container');

        container.scrollTop = 100;
        expect(container.scrollTop).toBe(100);

        rerender(<DescriptionContainer {...mockProps} selectedIndex={1} />);

        expect(container.scrollTop).toBe(0);
    });
});
