import React from 'react';
import { render } from '@testing-library/react';

import { defaultExperimentMock } from 'frontend/__mocks__/experiments';
import { cta2Mock, ctaMock, getMockedBannerFields } from 'frontend/__mocks__/heroBanners';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import HeroBannerTwinBox from './HeroBannerTwinBox';

jest.mock('frontend/store/holidays', () => ({
    isHolidayStore: jest.fn(() => false),
}));

const createStores = () => ({
    layoutStore: { isPricesHidden: true },
});
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: (props: any) => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextComponent(props);

        return <div data-tid='text' />;
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

const createProps = () => ({
    experiment: defaultExperimentMock,
    fields: {
        ...getMockedBannerFields(),
        Subtitle2: mockSitecoreField('Subtitle2'),
        TextBeforeNumber2: mockSitecoreField('#'),
        NumberValue2: mockSitecoreField('50'),
        TextAfterNumber2: mockSitecoreField('bb'),
        CTA2: cta2Mock,
    },
    onClick: jest.fn(),
});

let mockProps;

describe('HeroBannerTwinBox', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render default first box', () => {
        render(<HeroBannerTwinBox {...mockProps} />);

        expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(1, {
            className: 'hero-banner__subtitle',
            field: mockProps.fields.Subtitle,
            tag: 'div',
        });

        expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
            field: mockProps.fields.BottomText,
            tag: 'span',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
            className: 'hero-banner__promo-footer',
            field: mockProps.fields.BottomLinedText,
            tag: 'div',
        });

        expect(mockHeroBannerControls).toHaveBeenCalledWith({
            experiment: defaultExperimentMock,
            controlsFields: [ctaMock],
            type: mockProps.fields.CTAType.value,
            onClick: mockProps.onClick,
            isSecondBox: undefined,
        });
    });

    it('should return null when required subtitle is missing for main box', () => {
        mockProps.fields.Subtitle = mockSitecoreField('');

        const { container } = render(<HeroBannerTwinBox {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should return null when required subtitle is missing for second box', () => {
        mockProps.fields.Subtitle2 = mockSitecoreField('');

        const { container } = render(<HeroBannerTwinBox {...mockProps} isSecondBox />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('when isPricesHidden is false', () => {
        beforeEach(() => {
            mockStores.layoutStore.isPricesHidden = false;
        });

        it('should render price section for main box', () => {
            render(<HeroBannerTwinBox {...mockProps} />);

            expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
                className: 'hero-banner__price-currency',
                field: mockProps.fields.TextBeforeNumber,
                tag: 'span',
            });
            expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
                field: mockProps.fields.NumberValue,
                tag: 'span',
            });
            expect(mockTextComponent).toHaveBeenNthCalledWith(3, {
                field: mockProps.fields.TextAfterNumber,
                tag: 'span',
            });
        });

        it('should render price section for second box', () => {
            render(<HeroBannerTwinBox {...mockProps} isSecondBox />);

            expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(1, {
                className: 'hero-banner__subtitle',
                field: mockProps.fields.Subtitle2,
                tag: 'div',
            });

            expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
                className: 'hero-banner__price-currency',
                field: mockProps.fields.TextBeforeNumber2,
                tag: 'span',
            });
            expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
                field: mockProps.fields.NumberValue2,
                tag: 'span',
            });
            expect(mockTextComponent).toHaveBeenNthCalledWith(3, {
                field: mockProps.fields.TextAfterNumber2,
                tag: 'span',
            });

            expect(mockTextComponent).not.toHaveBeenCalledWith({
                field: mockProps.fields.BottomText,
                tag: 'span',
            });

            expect(mockTextComponent).not.toHaveBeenCalledWith({
                className: 'hero-banner__promo-footer',
                field: mockProps.fields.BottomLinedText,
                tag: 'div',
            });

            expect(mockHeroBannerControls).toHaveBeenCalledWith({
                experiment: defaultExperimentMock,
                controlsFields: [cta2Mock],
                type: mockProps.fields.CTAType.value,
                onClick: mockProps.onClick,
                isSecondBox: true,
            });
        });

        it('should NOT render price fields when they are undefined', () => {
            mockProps.fields.TextBeforeNumber = mockSitecoreField('');
            mockProps.fields.NumberValue = mockSitecoreField('');
            mockProps.fields.TextAfterNumber = mockSitecoreField('');

            render(<HeroBannerTwinBox {...mockProps} />);

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
