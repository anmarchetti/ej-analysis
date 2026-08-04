import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import {
    ComponentVersion,
    CTAThemeType,
    IBannerKeySellingPoint,
    PillColourVariant,
    TextAlignmentVariant,
} from 'models/data/IFullWithBanner';
import { TitleFontSizeMobileAndDesktop, TitleFontStyle } from 'models/enum/CustomisableComponentsParameters';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import { mockFullWidthBannerMockFields } from 'frontend/components/renderings/FullWidthBanner/mocks';

import BannerWithKeySellingPoints, { IBannerWithKeySellingPointsProps } from './BannerWithKeySellingPoints';

const resetMocks = (): IBannerWithKeySellingPointsProps => ({
    fields: mockFullWidthBannerMockFields(),
    params: {
        CTATheme: CTAThemeType.Filled,
        PillColour: PillColourVariant.Green,
        TextAlignment: TextAlignmentVariant.Right,
        TitleFontStyle: TitleFontStyle.Rounded,
        Version: ComponentVersion.NonSlimWithoutShard,
        TitleFontSize: TitleFontSizeMobileAndDesktop.Mobile24Desktop36,
    },
});

let mockProps: IBannerWithKeySellingPointsProps;

jest.mock('frontend/components/renderings/FullWidthBanner/components/FullWidthBannerPill/FullWidthBannerPill', () => ({
    __esModule: true,
    default: ({ PillText }) => <div data-tid='full-width-banner-pill'>{PillText.value}</div>,
}));

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext.tsx', () => ({
    __esModule: true,
    default: () => <div data-tid='jss-image-next' />,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='jss-text'>{field.value}</div>,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='rich-text-with-links'>{field.value}</div>,
}));

jest.mock(
    'frontend/components/renderings/FullWidthBanner/BannerWithKeySellingPoints/components/BannerKeySellingPoint',
    () => ({
        __esModule: true,
        default: ({ Label }) => <div data-tid='banner-key-selling-point'>{Label.value}</div>,
    }),
);

jest.mock(
    'frontend/components/renderings/FullWidthBanner/components/FullWidthBannerButton/FullWidthBannerButton',
    () => ({
        __esModule: true,
        default: () => <div data-tid='full-width-banner-button' />,
    }),
);

jest.mock('frontend/components/common/LuxuryBadge/LuxuryBadge', () => ({
    __esModule: true,
    default: () => <div data-tid='luxury-badge' />,
}));

describe('<BannerWithKeySellingPoints />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
    });

    it('should standard render with 2 key selling points', () => {
        mockProps.fields.KeySellingPoints.fields.Items = [
            { fields: { Label: mockSitecoreField('Key Selling Point 1') } },
            { fields: { Label: mockSitecoreField('Key Selling Point 2') } },
        ] as ISitecoreCompositeField<IBannerKeySellingPoint>[];

        render(<BannerWithKeySellingPoints {...mockProps} />);

        const keySellingPoints = screen.getAllByTestId('banner-key-selling-point');
        expect(screen.getByTestId('full-width-banner-pill')).toHaveTextContent('PillText');
        expect(screen.getByTestId('jss-text')).toHaveTextContent('Title');
        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('Description');
        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(screen.getByTestId('full-width-banner-button')).toBeInTheDocument();
        expect(keySellingPoints[0]).toHaveTextContent('Key Selling Point 1');
        expect(keySellingPoints[1]).toHaveTextContent('Key Selling Point 2');
        expect(screen.queryByTestId('luxury-badge')).not.toBeInTheDocument();
    });

    it('should render luxury badge when IsLuxuryBadge is true', () => {
        mockProps.fields.IsLuxuryBadge.value = true;

        render(<BannerWithKeySellingPoints {...mockProps} />);

        expect(screen.getByTestId('luxury-badge')).toBeInTheDocument();
    });

    it('should render right aligned wrapper when TextAlignment is right', () => {
        mockProps.params.TextAlignment = TextAlignmentVariant.Right;

        render(<BannerWithKeySellingPoints {...mockProps} />);

        expect(screen.getByTestId('banner-with-key-selling-points-info-wrapper')).toHaveClass('rightAligned');
    });

    it('should not render when required fields are missing', () => {
        mockProps.fields.Title = mockSitecoreField('');
        mockProps.fields.KeySellingPoints.fields.Items = [];

        const { container } = render(<BannerWithKeySellingPoints {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });
});
