import * as React from 'react';
import { render, screen } from '@testing-library/react';

import FooterRowThemes from 'models/enum/FooterRowThemes';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import PageFooterRow, { TPageFooterRowProps } from './PageFooterRow';

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

describe('<PageFooterRow />', () => {
    const resetMocks = (): TPageFooterRowProps => ({
        fields: undefined,
        rendering: {},
        params: { Theme: FooterRowThemes.Dropdowns },
    });

    let mockProps;

    beforeEach(() => {
        mockProps = resetMocks();
    });

    it('should render standard', () => {
        mockProps.rendering = { placeholders: { [PlaceholderNames.FooterColumn]: ['test'] } };
        render(<PageFooterRow {...mockProps} />);

        expect(screen.getByTestId('footer-row')).toHaveClass('footer__row row');
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.FooterColumn,
            rendering: mockProps.rendering,
        });
    });

    describe('Theme parameter', () => {
        it('should render first child with footer-dropdowns className except default ones when Theme is Dropdowns', () => {
            mockProps.params.Theme = FooterRowThemes.Dropdowns;
            render(<PageFooterRow {...mockProps} />);

            expect(screen.getByTestId('footer-row')).toHaveClass('footer__row row footer-dropdowns');
        });

        it('should render first child with footer-protection className except default ones when Theme is Protection', () => {
            mockProps.params.Theme = FooterRowThemes.Protection;
            render(<PageFooterRow {...mockProps} />);

            expect(screen.getByTestId('footer-row')).toHaveClass('footer__row row footer-protection');
        });

        it('should render first child with footer-need-help className except default ones when Theme is NeedHelp', () => {
            mockProps.params.Theme = FooterRowThemes.NeedHelp;
            render(<PageFooterRow {...mockProps} />);

            expect(screen.getByTestId('footer-row')).toHaveClass('footer__row row footer-need-help');
        });
    });
});
