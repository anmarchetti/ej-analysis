import React from 'react';
import { render, screen } from '@testing-library/react';

import { getMockedBannerFields } from 'frontend/__mocks__/heroBanners';

import HeroBannerHeader, { IHeroBannerHeaderProps } from './HeroBannerHeader';

const createProps = (): IHeroBannerHeaderProps => ({
    fields: getMockedBannerFields(),
});

let mockProps = createProps();

const mockJssImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJssImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

describe('<HeroBannerHeader />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<HeroBannerHeader {...mockProps} />);

        expect(screen.getByTestId('hero-banner-title')).toHaveClass('hero-banner__title');
        expect(screen.getAllByTestId('rich-text-with-links').length).toBe(2);
        expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(1, {
            field: mockProps.fields.Title,
            tag: 'span',
        });
        expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(2, {
            className: 'hero-banner__subtitle',
            field: mockProps.fields.Subtitle,
            tag: 'div',
        });
        expect(screen.getAllByTestId('jss-image').length).toBe(2);
        expect(mockJssImage).toHaveBeenNthCalledWith(1, {
            field: mockProps.fields.Icon,
        });
        expect(mockJssImage).toHaveBeenNthCalledWith(2, {
            field: mockProps.fields.PromoLogo,
            className: 'hero-banner__logo-for-title d-none',
        });
    });

    it('should skip render when corresponding titles are undefined', () => {
        mockProps.fields.Title = undefined;
        mockProps.fields.Subtitle = undefined;

        const { container } = render(<HeroBannerHeader {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
