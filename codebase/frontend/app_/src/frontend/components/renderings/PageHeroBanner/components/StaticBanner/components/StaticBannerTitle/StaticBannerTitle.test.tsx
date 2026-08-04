import React from 'react';
import { render, screen } from '@testing-library/react';

import { ENGLISH } from 'code/cmsLang';
import { createMockStores } from 'frontend/__mocks__';
import * as stylesUtils from 'frontend/utils/componentStylesCustomisation.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IHeroBannerFields } from 'models/data/IHeroBanner';
import { TitleFontSizeMobileAndDesktopBanner, TitleFontStyle } from 'models/enum/CustomisableComponentsParameters';
import PageHeroBannerTextOrderOptions from 'models/enum/PageHeroBannerTextOrderOptions';
import PageHeroBannerVariants from 'models/enum/PageHeroBannerVariants';
import * as stylesStaticBannerUtils from 'frontend/components/renderings/PageHeroBanner/components/StaticBanner/StaticBanner.utils';

import BannerTitle, { IBannerTitleProps } from './StaticBannerTitle';

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    JSSImage: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='text'>{props.field.value}</div>;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
let mockProps;

const createMockProps = (): IBannerTitleProps => ({
    fields: {
        Name: mockSitecoreField('Name'),
        ComposedTitle: mockSitecoreField('ComposedTitle'),
        Subtitle: mockSitecoreField('Subtitle'),
        Title: mockSitecoreField('Title'),
        Icon: mockSitecoreField(mockSitecoreImageField('src')),
    } as IHeroBannerFields,
    params: {
        FontSize: TitleFontSizeMobileAndDesktopBanner.Mobile40Desktop66,
        TitleTag: 'H3',
        TextOrder: PageHeroBannerTextOrderOptions.SubtitleFirst,
        TitleFontStyle: TitleFontStyle.Default,
    },
    isStripeBottomVariant: false,
});

const mockGetTitleFontClassName = jest.spyOn(stylesUtils, 'getTitleFontClassName');
const mockGetBannerTitleFontSizeClassName = jest.spyOn(stylesStaticBannerUtils, 'getBannerTitleFontSizeClassName');

describe('BannerTitle', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                lang: ENGLISH,
                isDestinationPage: false,
            },
        });
        mockProps = createMockProps();
    });

    describe('isSubtitleFirst param', () => {
        it('should add reverseWrapper class when isSubtitleFirst', () => {
            render(<BannerTitle {...mockProps} />);

            expect(screen.getByTestId('banner-title-wrapper')).toHaveClass('reverseWrapper');
        });

        it('should NOT add reverseWrapper class when TitleFirst', () => {
            mockProps.params.TextOrder = PageHeroBannerTextOrderOptions.TitleFirst;
            render(<BannerTitle {...mockProps} />);

            expect(screen.getByTestId('banner-title-wrapper')).not.toHaveClass('reverseWrapper');
        });
    });

    describe('title', () => {
        it('should render ComposedTitle on EUX markets', () => {
            mockStores.layoutStore.lang = 'ch-fr';
            render(<BannerTitle {...mockProps} />);

            expect(screen.getByText(mockProps.fields.ComposedTitle.value)).toBeInTheDocument();
        });

        it('should render Title on EUX markets when ComposedTitle is absent', () => {
            mockStores.layoutStore.lang = 'ch-fr';
            mockProps.fields.ComposedTitle = undefined;

            render(<BannerTitle {...mockProps} />);

            expect(screen.getByText(mockProps.fields.Title.value)).toBeInTheDocument();
        });

        it('should render Name on EUX markets when ComposedTitle and Title are absent', () => {
            mockStores.layoutStore.lang = 'ch-fr';
            mockProps.fields.ComposedTitle = undefined;
            mockProps.fields.Title = undefined;

            render(<BannerTitle {...mockProps} />);

            expect(screen.getByText(mockProps.fields.Name.value)).toBeInTheDocument();
        });

        it('should render title with subtitle with title on EUX destination pages', () => {
            mockStores.layoutStore.lang = 'ch-fr';
            mockStores.layoutStore.isDestinationPage = true;
            mockProps.fields.ComposedTitle = undefined;

            render(<BannerTitle {...mockProps} />);

            expect(
                screen.getByText(`${mockProps.fields.Title.value} ${mockProps.fields.Subtitle.value}`),
            ).toBeInTheDocument();
        });

        it('should render sitecore taq', () => {
            render(<BannerTitle {...mockProps} />);

            expect(screen.getByTestId('banner-title').tagName).toBe(mockProps.params.TitleTag);
        });

        it('should render default taq', () => {
            mockProps.params.TitleTag = undefined;
            render(<BannerTitle {...mockProps} />);

            expect(screen.getByTestId('banner-title').tagName).toBe('H1');
        });

        it('should add titleClassNames', () => {
            mockGetBannerTitleFontSizeClassName.mockReturnValue('test-class');
            mockGetTitleFontClassName.mockReturnValue('test-font-class');

            render(<BannerTitle {...mockProps} />);

            expect(screen.getByTestId('banner-title')).toHaveClass('test-class test-font-class');
            expect(mockGetBannerTitleFontSizeClassName).toHaveBeenCalledWith(mockProps.params.FontSize);
            expect(mockGetTitleFontClassName).toHaveBeenCalledWith(mockProps.params.TitleFontStyle);
        });

        it('should call getTitleFontClassName and mockGetBannerTitleFontSizeClassName with undefined when params are NOT provided', () => {
            mockProps.params = undefined;

            render(<BannerTitle {...mockProps} />);

            expect(mockGetBannerTitleFontSizeClassName).toHaveBeenCalledWith(undefined);
            expect(mockGetTitleFontClassName).toHaveBeenCalledWith(undefined);
        });

        it('should add stripeTitle class name when isStripeBottomVariant is true', () => {
            mockProps.isStripeBottomVariant = true;
            render(<BannerTitle {...mockProps} />);

            expect(screen.getByTestId('banner-title')).toHaveClass('stripeTitle');
        });

        it('should add smallTitle class name when GreySmallBanner is true', () => {
            mockProps.params.Variant = PageHeroBannerVariants.GreySmallBanner;
            render(<BannerTitle {...mockProps} />);

            expect(screen.getByTestId('banner-title')).toHaveClass('smallTitle');
        });

        it('should add smallTitle class name when GreySmallCentetedTextBanner is true', () => {
            mockProps.params.Variant = PageHeroBannerVariants.GreySmallCentetedTextBanner;
            render(<BannerTitle {...mockProps} />);

            expect(screen.getByTestId('banner-title')).toHaveClass('smallTitle');
        });

        it('should render icon', () => {
            render(<BannerTitle {...mockProps} />);

            expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        });

        it('should render icon with smallIcon class when GreySmallBanner is true', () => {
            mockProps.params.Variant = PageHeroBannerVariants.GreySmallBanner;
            render(<BannerTitle {...mockProps} />);

            expect(mockJSSImageProps).toHaveBeenCalledWith({
                field: mockProps.fields.Icon,
                className: 'icon smallIcon',
            });
        });

        it('should render icon with smallIcon class when GreySmallCentetedTextBanner is true', () => {
            mockProps.params.Variant = PageHeroBannerVariants.GreySmallCentetedTextBanner;
            render(<BannerTitle {...mockProps} />);

            expect(mockJSSImageProps).toHaveBeenCalledWith({
                field: mockProps.fields.Icon,
                className: 'icon smallIcon',
            });
        });
    });

    describe('smallSubtitle', () => {
        it('should add smallSubtitle class to subtitle when GreySmallBanner is true', () => {
            mockProps.params.Variant = PageHeroBannerVariants.GreySmallBanner;
            render(<BannerTitle {...mockProps} />);

            expect(mockTextProps).toHaveBeenCalledWith({
                className: 'subtitle smallSubtitle',
                field: mockProps.fields.Subtitle,
                tag: 'div',
                'data-tid': 'static-banner-subtitle',
            });
        });

        it('should add smallSubtitle class to subtitle when GreySmallCentetedTextBanner is true', () => {
            mockProps.params.Variant = PageHeroBannerVariants.GreySmallCentetedTextBanner;
            render(<BannerTitle {...mockProps} />);

            expect(mockTextProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'subtitle smallSubtitle',
                }),
            );
        });

        it('should NOT add smallSubtitle class to subtitle when GreySmallCentetedTextBanner and GreySmallBanner are false', () => {
            render(<BannerTitle {...mockProps} />);

            expect(mockTextProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'subtitle',
                }),
            );
        });
    });
});
