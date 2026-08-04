import React from 'react';
import { render, screen } from '@testing-library/react';

import { defaultExperimentMock } from 'frontend/__mocks__/experiments';
import { cta2Mock, ctaMock, getMockedBannerFields } from 'frontend/__mocks__/heroBanners';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import BannerCTAType from 'models/enum/banners/CTAType';

import HeroBannerBox, { IHeroBannerBoxProps } from './HeroBannerBox';

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: () => <div data-tid='jss-image' />,
}));

jest.mock('frontend/store/holidays', () => ({
    isHolidayStore: jest.fn(() => false),
}));

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextComponent(props);

        return <div data-tid='text' />;
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

const mockHeroBannerControls = jest.fn();
jest.mock(
    'frontend/components/renderings/GenericHeroBanner/components/HeroBannerControls/HeroBannerControls',
    () => props => {
        mockHeroBannerControls(props);

        return <div data-tid='hero-banner-controls' />;
    },
);

const createStores = () => ({
    layoutStore: { isPricesHidden: true },
});

const createProps = (): IHeroBannerBoxProps => ({
    experiment: defaultExperimentMock,
    fields: { ...getMockedBannerFields(), CTA2: cta2Mock },
    onClick: jest.fn(),
    hasAdditionalControl: true,
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HeroBannerBox />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render default', () => {
        render(<HeroBannerBox {...mockProps} />);

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
            field: mockProps.fields.TopText,
            tag: 'span',
        });

        expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(1, {
            className: 'hero-banner__title',
            field: mockProps.fields.Title,
            tag: 'h2',
        });

        expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(2, {
            className: 'hero-banner__subtitle',
            field: mockProps.fields.Subtitle,
            tag: 'div',
        });

        expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
            field: mockProps.fields.BottomText,
            tag: 'span',
        });

        expect(mockTextComponent).toHaveBeenNthCalledWith(3, {
            field: mockProps.fields.BottomLinedText,
            tag: 'div',
            className: 'hero-banner__promo-footer',
        });

        expect(mockHeroBannerControls).toHaveBeenCalledWith({
            experiment: defaultExperimentMock,
            controlsFields: [ctaMock, cta2Mock],
            type: BannerCTAType.Orange,
            onClick: mockProps.onClick,
        });

        expect(mockTextComponent).not.toHaveBeenCalledWith({
            className: 'hero-banner__price-currency',
            field: mockProps.fields.TextBeforeNumber,
            tag: 'span',
        });
        expect(mockTextComponent).not.toHaveBeenCalledWith({
            field: mockProps.fields.NumberValue,
            tag: 'span',
        });
        expect(mockTextComponent).not.toHaveBeenCalledWith({
            field: mockProps.fields.TextAfterNumber,
            tag: 'span',
        });
    });

    it('should call HeroBannerControls with only first CTA when hasAdditionalControl is false', () => {
        mockProps.hasAdditionalControl = false;

        render(<HeroBannerBox {...mockProps} />);

        expect(mockHeroBannerControls).toHaveBeenCalledWith({
            experiment: defaultExperimentMock,
            controlsFields: [ctaMock],
            type: BannerCTAType.Orange,
            onClick: mockProps.onClick,
        });
    });

    describe('logo section', () => {
        it('should display logo section when TopText only provided', () => {
            mockProps.fields.Icon = mockSitecoreField({ src: '' });

            render(<HeroBannerBox {...mockProps} />);

            expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
            expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
                field: mockProps.fields.TopText,
                tag: 'span',
            });
        });

        it('should display logo section when Icon only provided', () => {
            mockProps.fields.TopText = mockSitecoreField('');

            render(<HeroBannerBox {...mockProps} />);

            expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        });

        it('should NOT display the logo section when neither Icon nor TopText are provided', () => {
            mockProps.fields.Icon = mockSitecoreField({ src: '' });
            mockProps.fields.TopText = mockSitecoreField('');

            render(<HeroBannerBox {...mockProps} />);

            expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
            expect(mockTextComponent).not.toHaveBeenCalledWith({
                field: mockProps.fields.TopText,
                tag: 'span',
            });
        });
    });

    describe('when isPricesHidden is false', () => {
        beforeEach(() => {
            mockStores.layoutStore.isPricesHidden = false;
        });

        it('should render price fields', () => {
            render(<HeroBannerBox {...mockProps} />);

            expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
                className: 'hero-banner__price-currency',
                field: mockProps.fields.TextBeforeNumber,
                tag: 'span',
            });
            expect(mockTextComponent).toHaveBeenNthCalledWith(3, {
                field: mockProps.fields.NumberValue,
                tag: 'span',
            });
            expect(mockTextComponent).toHaveBeenNthCalledWith(4, {
                field: mockProps.fields.TextAfterNumber,
                tag: 'span',
            });
        });

        it('should NOT render price fields when they are undefined', () => {
            mockProps.fields.TextBeforeNumber = mockSitecoreField('');
            mockProps.fields.NumberValue = mockSitecoreField('');
            mockProps.fields.TextAfterNumber = mockSitecoreField('');

            render(<HeroBannerBox {...mockProps} />);

            expect(mockTextComponent).not.toHaveBeenCalledWith({
                className: 'hero-banner__price-currency',
                field: mockProps.fields.TextBeforeNumber,
                tag: 'span',
            });
            expect(mockTextComponent).not.toHaveBeenCalledWith({
                field: mockProps.fields.NumberValue,
                tag: 'span',
            });
            expect(mockTextComponent).not.toHaveBeenCalledWith({
                field: mockProps.fields.TextAfterNumber,
                tag: 'span',
            });
        });
    });
});
