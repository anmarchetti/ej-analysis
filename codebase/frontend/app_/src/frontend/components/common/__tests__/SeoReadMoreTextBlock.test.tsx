import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import classNames from 'classnames';

import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import * as htmlUtils from 'frontend/utils/html.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SeoReadMoreTextBlock, {
    DEFAULT_DESKTOP_MAX_HEIGHT,
    DEFAULT_MOBILE_MAX_HEIGHT,
} from 'frontend/components/common/SeoReadMoreTextBlock';

const createProps = () => ({
    text: 'Text',
});

let mockStores;
let mockProps;

jest.mock('frontend/hooks/useMediaQuery');

jest.mock('../RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('classnames', () => jest.fn(p => p));
const mockedClassNames = classNames as jest.MockedFn<typeof classNames>;
const isEmptyHtmlContentSpy = jest.spyOn(htmlUtils, 'isEmptyHtmlContent');

describe('<SeoReadMoreTextBlock />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        mockedClassNames.mockClear();
        jest.mocked(useMobileViewport).mockReturnValue(true);
    });

    it('should render text container with css variables set to default values', () => {
        const { container } = render(<SeoReadMoreTextBlock {...mockProps} />);

        const textContainer = container.querySelector('.seo-read-more-text-block');
        const computedStyle = getComputedStyle(textContainer as HTMLElement);

        expect(computedStyle.getPropertyValue('--mobile-seo-read-more')).toBe(`${DEFAULT_MOBILE_MAX_HEIGHT}px`);
        expect(computedStyle.getPropertyValue('--desktop-seo-read-more')).toBe(`${DEFAULT_DESKTOP_MAX_HEIGHT}px`);
    });

    it('should render text container with css variables set to values which were passed to props', () => {
        mockProps.overallHeightMobile = 10;
        mockProps.overallHeightDesktop = 20;
        const { container } = render(<SeoReadMoreTextBlock {...mockProps} />);

        const textContainer = container.querySelector('.seo-read-more-text-block');
        const computedStyle = getComputedStyle(textContainer as HTMLElement);

        expect(computedStyle.getPropertyValue('--mobile-seo-read-more')).toBe(`${mockProps.overallHeightMobile}px`);
        expect(computedStyle.getPropertyValue('--desktop-seo-read-more')).toBe(`${mockProps.overallHeightDesktop}px`);
    });

    it('should render without read more button when height of text is lower than 200', () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(false);

        render(<SeoReadMoreTextBlock {...mockProps} />);

        expect(screen.getByText('Text')).toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.GlobalsButtonsReadMore)).not.toBeInTheDocument();
    });

    it('should render without read more button when height of text is lower than 130 on mobile', () => {
        render(<SeoReadMoreTextBlock {...mockProps} />);

        expect(screen.getByText('Text')).toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.GlobalsButtonsReadMore)).not.toBeInTheDocument();
    });

    describe('hideEmptyHtml', () => {
        it('should render component when hideEmptyHtml is false', () => {
            isEmptyHtmlContentSpy.mockReturnValue(true);
            mockProps.hideEmptyHtml = false;

            render(<SeoReadMoreTextBlock {...mockProps} />);

            expect(screen.getByText('Text')).toBeInTheDocument();
        });

        it('should render component when hideEmptyHtml is true and isEmptyHtmlContent is false', () => {
            isEmptyHtmlContentSpy.mockReturnValue(false);
            mockProps.hideEmptyHtml = true;

            render(<SeoReadMoreTextBlock {...mockProps} />);

            expect(screen.getByText('Text')).toBeInTheDocument();
        });

        it('should not render when hideEmptyHtml is true and isEmptyHtmlContent is true', () => {
            isEmptyHtmlContentSpy.mockReturnValue(true);
            mockProps.hideEmptyHtml = true;

            const { container } = render(<SeoReadMoreTextBlock {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('Checking is expanded', () => {
        it('should render GlobalsButtonsReadMore when height of text is higher than 130 on mobile', () => {
            Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
                configurable: true,
                value: 200,
            });
            render(<SeoReadMoreTextBlock {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.GlobalsButtonsReadMore)).toBeInTheDocument();
        });

        it('should render GlobalsButtonsReadMore when height of text is higher than overallHeightMobile on mobile', () => {
            mockProps.overallHeightMobile = 50;
            Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
                configurable: true,
                value: 60,
            });
            render(<SeoReadMoreTextBlock {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.GlobalsButtonsReadMore)).toBeInTheDocument();
        });

        it('should render GlobalsButtonsReadMore when height of text is higher than 200 on desktop', () => {
            jest.mocked(useMobileViewport).mockReturnValueOnce(false);

            Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
                configurable: true,
                value: 210,
            });
            render(<SeoReadMoreTextBlock {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.GlobalsButtonsReadMore)).toBeInTheDocument();
        });

        it('should render GlobalsButtonsReadMore when height of text is higher than overallHeightDesktop on desktop', () => {
            jest.mocked(useMobileViewport).mockReturnValueOnce(false);

            mockProps.overallHeightDesktop = 1000;
            Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
                configurable: true,
                value: 1010,
            });
            render(<SeoReadMoreTextBlock {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.GlobalsButtonsReadMore)).toBeInTheDocument();
        });

        it('should NOT render GlobalsButtonsReadMore when scrollHeight does NOT exist', () => {
            mockProps.overallHeightMobile = 1;
            Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
                configurable: true,
                value: null,
            });
            render(<SeoReadMoreTextBlock {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.GlobalsButtonsReadMore)).not.toBeInTheDocument();
        });

        it('should expand after read more button was clicked', async () => {
            Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
                configurable: true,
                value: 200,
            });
            render(<SeoReadMoreTextBlock {...mockProps} />);
            await userEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsReadMore));
            expect(mockedClassNames).toHaveBeenCalledWith(
                'seo-read-more-text-block seo-read-more-text-block--fixed-height',
            );
        });
    });
});
