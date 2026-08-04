import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import * as utils from 'frontend/utils/componentStylesCustomisation.utils';
import isBackend from 'frontend/utils/isBackend';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { TextPosition, TitleFontStyle, TitleWeight } from 'models/enum/CustomisableComponentsParameters';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import { DEFAULT_OVERALL_HEIGHT, TextBlock } from './TextBlock';

jest.mock('frontend/utils/isBackend', () => jest.fn());
const mockIsBacked = isBackend as jest.MockedFn<typeof isBackend>;
const mockRichTextWithLinksComponent = jest.fn();
const mockSeoReadMoreTextBlockComponent = jest.fn();
const mockReadMoreTextBlockComponent = jest.fn();
const mockRouterLinkComponent = jest.fn();
const mockPlaceholderComponent = jest.fn();
const customisableTitleClassName = 'customisableTitleClassName';
jest.spyOn(utils, 'getCustomisableTitleClassName').mockReturnValue(customisableTitleClassName);
const textBlockTextPositionClassName = 'textBlockTextPositionClassName';
jest.spyOn(utils, 'getTextBlockTextPositionClassName').mockReturnValue(textBlockTextPositionClassName);

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, ...props }) => {
        mockRichTextWithLinksComponent(props);

        return <div data-tid='richtext-with-links'>{field.value}</div>;
    },
}));

jest.mock('frontend/components/common/SeoReadMoreTextBlock', () => ({
    __esModule: true,
    default: ({ text, ...props }) => {
        mockSeoReadMoreTextBlockComponent(props);

        return <div data-tid='seo-read-more-text-block'>{text}</div>;
    },
}));

jest.mock('frontend/components/common/ReadMoreTextBlock', () => ({
    __esModule: true,
    default: ({ text, ...props }) => {
        mockReadMoreTextBlockComponent(props);

        return <div data-tid='read-more-text-block'>{text}</div>;
    },
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockRouterLinkComponent(props);

        return <div data-tid='router-link'>{children}</div>;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: ({ ...props }) => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

const mockJSSIMageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSIMageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

const createStores = () => ({
    layoutStore: { isEditMode: false },
    appStore: { isScreenLessMedium: false },
});

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Description: mockSitecoreField('Description'),
        Link: mockSitecoreField({ href: 'href', text: 'text' }),
        Icon: mockSitecoreField(mockSitecoreImageField('src')),
    },
    params: {
        TitleFontSize: 'Mobile - 18px Desktop - 24px',
        PaddingSize: '16px',
        TitleTag: 'h1',
        ClassName: 'test-class',
        TruncateTextOnMobile: '1',
        EnableSeoReadMoreText: '1',
        DescriptionPosition: TextPosition.Center,
        TitleWeight: TitleWeight.Weight100,
        TitlePosition: TextPosition.Center,
        TitleFontStyle: TitleFontStyle.GenerationHeadline,
    },
    rendering: { placeholders: { [PlaceholderNames.ModalDialog]: [1, 2] } },
    height: 100,
    customDescription: 'Custom Description',
});

let mockStores = createStores();
let mockProps;

const mockUseRef = jest.fn((): { current?: { scrollHeight: number | undefined } } => ({ current: undefined }));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useRef: () => mockUseRef(),
}));

describe('<TextBlock />', () => {
    beforeEach(() => {
        mockIsBacked.mockReturnValue(false);
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: { isEditMode: false },
            appStore: { isScreenLessMedium: false },
            queryParamStore: {},
        });
    });

    it('should NOT render when fields are NOT provided', () => {
        mockProps.fields = null;
        const { container } = render(<TextBlock {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render container with className from props', () => {
        jest.spyOn(utils, 'getPaddingSizeClassName').mockReturnValue('padding-16');
        const { container } = render(<TextBlock {...mockProps} />);

        const block = container.getElementsByClassName('text-block')[0];
        expect(block).toHaveClass('test-class');
        expect(block).toHaveClass('padding-16');
    });

    it('should call all customisable methods', () => {
        render(<TextBlock {...mockProps} />);

        expect(screen.getByTestId('button-wrapper')).toHaveClass(textBlockTextPositionClassName);
        expect(screen.getByRole('heading')).toHaveClass(customisableTitleClassName);
    });

    it('should render icon', () => {
        render(<TextBlock {...mockProps} />);

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSIMageNextProps).toHaveBeenCalledWith({
            field: mockProps.fields.Icon,
            className: 'text-block__icon',
            dynamicSize: {
                desktop: {
                    height: 40,
                    width: 40,
                },
                mobile: {
                    height: 40,
                    width: 40,
                },
            },
            mediaSize: MediaSize.Small,
        });
    });

    it('should render icon with sizes from sitecore for desktop', () => {
        mockProps.fields.Icon.value.width = 80;
        mockProps.fields.Icon.value.height = 60;
        render(<TextBlock {...mockProps} />);

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSIMageNextProps).toHaveBeenCalledWith({
            field: mockProps.fields.Icon,
            className: 'text-block__icon',
            dynamicSize: {
                desktop: {
                    height: 60,
                    width: 80,
                },
                mobile: {
                    height: 40,
                    width: 40,
                },
            },
            mediaSize: MediaSize.Small,
        });
    });

    describe('Title', () => {
        it('should render title as normal div when title tag is NOT provided', () => {
            mockProps.params = { TitleTag: undefined };
            render(<TextBlock {...mockProps} />);

            expect(screen.queryByRole('heading')).not.toBeInTheDocument();
            expect(screen.getByText('Title')).toBeInTheDocument();
        });

        it('should render title as heading when title tag is provided', () => {
            render(<TextBlock {...mockProps} />);

            expect(screen.getByRole('heading')).toHaveTextContent('Title');
        });

        it('should render rounded title', () => {
            mockProps.params = { TitleFontStyle: TitleFontStyle.Rounded };
            render(<TextBlock {...mockProps} />);

            expect(screen.getByText('Title')).toHaveClass('customisableTitleClassName');
        });

        it('should render icon above when IsIconAboveTitle is true', () => {
            mockProps.params = { IsIconAboveTitle: '1' };
            render(<TextBlock {...mockProps} />);

            expect(screen.getByText('Title')).toHaveClass('customisableTitleClassName text-block__header--icon-above');
        });
    });

    describe('Description', () => {
        it('should NOT render description when description and customDescription is NOT provided', () => {
            mockProps.fields.Description = null;
            mockProps.customDescription = null;
            render(<TextBlock {...mockProps} />);

            expect(screen.queryByText('Description')).not.toBeInTheDocument();
        });

        it('should render Custom Description when description is NOT provided and customDescription is provided', () => {
            mockProps.fields.Description = null;
            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('read-more-text-block')).toHaveTextContent('Custom Description');
            expect(mockReadMoreTextBlockComponent).toHaveBeenCalledWith({
                className: 'text-block__description textBlockTextPositionClassName',
                isActiveOnlyOnMobile: true,
                truncateOptions: { decodeEntities: true, length: 200, reserveLastWord: true },
            });
        });

        it('should render ReadMoreTextBlock when is NOT EditMode, is NOT Backend and TruncateTextOnMobile', () => {
            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('read-more-text-block')).toHaveTextContent('Description');
            expect(mockReadMoreTextBlockComponent).toHaveBeenCalledWith({
                className: 'text-block__description textBlockTextPositionClassName',
                isActiveOnlyOnMobile: true,
                truncateOptions: { decodeEntities: true, length: 200, reserveLastWord: true },
            });
        });

        it('should render RichTextWithLinks with description class names when EnableSeoReadMoreText and TruncateTextOnMobile are undefined', () => {
            mockProps.params.EnableSeoReadMoreText = undefined;
            mockProps.params.TruncateTextOnMobile = undefined;
            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('richtext-with-links')).toHaveTextContent('Description');
            expect(mockRichTextWithLinksComponent).toHaveBeenCalledWith({
                className: 'text-block__description textBlockTextPositionClassName',
                dataId: 'text-block-description',
            });
        });

        it('should render SeoReadMoreTextBlock with specific height when title ref is defined', () => {
            const mockScrollHeight = 20;
            const mockMarginTop = 5;
            const mockMarginBottom = 5;
            mockUseRef.mockImplementationOnce(
                jest.fn((): { current?: { scrollHeight: number } } => ({
                    current: { scrollHeight: mockScrollHeight },
                })),
            );
            mockProps.params.TruncateTextOnMobile = undefined;
            jest.spyOn(window, 'getComputedStyle').mockReturnValueOnce({
                marginTop: mockMarginTop,
                marginBottom: mockMarginBottom,
            } as unknown as CSSStyleDeclaration);

            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('seo-read-more-text-block')).toHaveTextContent('Description');
            expect(mockSeoReadMoreTextBlockComponent).toHaveBeenCalledWith({
                className: 'promopage-search-pod-description',
                overallHeightDesktop: mockProps.height - mockScrollHeight - mockMarginTop - mockMarginBottom,
            });
        });

        it('should render SeoReadMoreTextBlock with specific height when title ref is defined, but scrollHeight is not present in current', () => {
            const mockMarginTop = 5;
            const mockMarginBottom = 5;
            mockUseRef.mockImplementationOnce(
                jest.fn((): { current?: { scrollHeight: number | undefined } } => ({
                    current: { scrollHeight: undefined },
                })),
            );
            mockProps.params.TruncateTextOnMobile = undefined;
            jest.spyOn(window, 'getComputedStyle').mockReturnValueOnce({
                marginTop: mockMarginTop,
                marginBottom: mockMarginBottom,
            } as unknown as CSSStyleDeclaration);

            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('seo-read-more-text-block')).toHaveTextContent('Description');
            expect(mockSeoReadMoreTextBlockComponent).toHaveBeenCalledWith({
                className: 'promopage-search-pod-description',
                overallHeightDesktop: mockProps.height - mockMarginTop - mockMarginBottom,
            });
        });

        it('should render SeoReadMoreTextBlock with overallHeightDesktop prop set to height when TruncateTextOnMobile is undefined', () => {
            mockProps.params.TruncateTextOnMobile = undefined;
            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('seo-read-more-text-block')).toHaveTextContent('Description');
            expect(mockSeoReadMoreTextBlockComponent).toHaveBeenCalledWith({
                className: 'promopage-search-pod-description',
                overallHeightDesktop: mockProps.height,
            });
        });

        it('should render SeoReadMoreTextBlock with overallHeightDesktop prop set to DEFAULT_OVERALL_HEIGHT when TruncateTextOnMobile & height undefined', () => {
            mockProps.params.TruncateTextOnMobile = undefined;
            mockProps.height = undefined;
            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('seo-read-more-text-block')).toHaveTextContent('Description');
            expect(mockSeoReadMoreTextBlockComponent).toHaveBeenCalledWith({
                className: 'promopage-search-pod-description',
                overallHeightDesktop: DEFAULT_OVERALL_HEIGHT,
            });
        });

        it('should render SeoReadMoreTextBlock when is backend', () => {
            mockIsBacked.mockReturnValueOnce(true);
            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('seo-read-more-text-block')).toHaveTextContent('Description');
        });

        it('should render SeoReadMoreTextBlock when is Edit mode', () => {
            mockStores.layoutStore.isEditMode = true;
            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('seo-read-more-text-block')).toHaveTextContent('Description');
        });
    });

    describe('Link', () => {
        it('should NOT render RouterLink when Link is NOT provided', () => {
            mockProps.fields.Link = null;
            render(<TextBlock {...mockProps} />);

            expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
        });

        it('should render RouterLink when Link is provided', () => {
            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('router-link')).toBeInTheDocument();
            expect(mockRouterLinkComponent).toHaveBeenCalledWith({ link: mockProps.fields.Link });
        });

        it('should NOT render Placeholder when Placeholder is NOT provided', () => {
            mockProps.rendering.placeholders[PlaceholderNames.ModalDialog] = [];
            render(<TextBlock {...mockProps} />);

            expect(screen.queryByTestId('placeholder')).not.toBeInTheDocument();
        });

        it('should render Placeholder when Placeholder is provided', () => {
            render(<TextBlock {...mockProps} />);

            expect(screen.getByTestId('placeholder')).toBeInTheDocument();
            expect(mockPlaceholderComponent).toHaveBeenCalledWith({
                name: PlaceholderNames.ModalDialog,
                rendering: mockProps.rendering,
            });
        });
    });
});
