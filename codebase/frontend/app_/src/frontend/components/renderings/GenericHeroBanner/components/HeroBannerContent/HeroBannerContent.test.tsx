import React from 'react';
import { render, screen } from '@testing-library/react';

import { beachExperimentMock } from 'frontend/__mocks__/experiments';
import { getMockedBannerFields } from 'frontend/__mocks__/heroBanners';
import GenericHeroBannerVariant from 'models/enum/GenericHeroBannerVariant';

import HeroBannerContent, { IHeroBannerContentProps } from './HeroBannerContent';

const createProps = (): IHeroBannerContentProps => ({
    fields: getMockedBannerFields(),
    experiment: beachExperimentMock,
    handleClickButton: jest.fn(),
});

let mockProps = createProps();

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div {...props} data-tid='rich-text-with-links' />;
    },
}));

const mockHeroBannerHeader = jest.fn();
jest.mock('frontend/components/renderings/GenericHeroBanner/components/HeroBannerHeader/HeroBannerHeader', () => ({
    __esModule: true,
    default: props => {
        mockHeroBannerHeader(props);

        return <div data-tid='hero-banner-header' />;
    },
}));

const mockCreditAnchor = jest.fn();
jest.mock('frontend/components/common/CreditAnchor/CreditAnchor', () => ({
    __esModule: true,
    default: props => {
        mockCreditAnchor(props);

        return <div data-tid='credit-anchor' />;
    },
}));

const mockHeroBannerBox = jest.fn();
jest.mock('frontend/components/renderings/GenericHeroBanner/components/HeroBannerBox/HeroBannerBox', () => props => {
    mockHeroBannerBox(props);

    return <div data-tid='hero-banner-box' />;
});

const mockHeroBannerLightBox = jest.fn();
jest.mock(
    'frontend/components/renderings/GenericHeroBanner/components/HeroBannerLightBox/HeroBannerLightBox',
    () => props => {
        mockHeroBannerLightBox(props);

        return <div data-tid='hero-banner-light-box' />;
    },
);

const mockHeroBannerStripeBox = jest.fn();
jest.mock(
    'frontend/components/renderings/GenericHeroBanner/components/HeroBannerStripeBox/HeroBannerStripeBox',
    () => props => {
        mockHeroBannerStripeBox(props);

        return <div data-tid='hero-banner-stripe-box' />;
    },
);

const mockHeroBannerUnboundedBrand = jest.fn();
jest.mock(
    'frontend/components/renderings/GenericHeroBanner/components/HeroBannerUnboundedBrand/HeroBannerUnboundedBrand',
    () => props => {
        mockHeroBannerUnboundedBrand(props);

        return <div data-tid='hero-banner-unbounded-brand' />;
    },
);

const mockBannerTwinBox = jest.fn();
jest.mock(
    'frontend/components/renderings/GenericHeroBanner/components/HeroBannerTwinBox/HeroBannerTwinBox',
    () => props => {
        mockBannerTwinBox(props);

        return <div data-tid='hero-banner-twin-box' />;
    },
);

const mockHeroBannerLightboxWithRoundel = jest.fn();
jest.mock(
    'frontend/components/renderings/GenericHeroBanner/components/HeroBannerLightboxWithRoundel/HeroBannerLightboxWithRoundel',
    () => props => {
        mockHeroBannerLightboxWithRoundel(props);

        return <div data-tid='hero-banner-lightbox-with-roundel' />;
    },
);

describe('<HeroBannerContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<HeroBannerContent {...mockProps} />);

        expect(mockHeroBannerHeader).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });
    });

    describe('variants', () => {
        it('should render Standard Variant', () => {
            mockProps.fields.Variant.value = GenericHeroBannerVariant.Standard;

            render(<HeroBannerContent {...mockProps} />);

            expect(mockHeroBannerBox).toHaveBeenCalledWith({
                fields: mockProps.fields,
                experiment: beachExperimentMock,
                onClick: mockProps.handleClickButton,
            });
        });

        it('should render OneBox Variant', () => {
            mockProps.fields.Variant.value = GenericHeroBannerVariant.OneBox;

            render(<HeroBannerContent {...mockProps} />);

            expect(mockHeroBannerBox).toHaveBeenCalledWith({
                fields: mockProps.fields,
                experiment: beachExperimentMock,
                onClick: mockProps.handleClickButton,
                hasAdditionalControl: true,
            });
        });

        it('should render DualLightboxSlim Variant', () => {
            mockProps.fields.Variant.value = GenericHeroBannerVariant.DualLightboxSlim;

            render(<HeroBannerContent {...mockProps} />);

            expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(1, {
                className: 'hero-banner__title text-color--black',
                field: mockProps.fields.Title,
                tag: 'h2',
            });
            expect(screen.getByTestId('hero-banner-content-box')).toHaveClass('content-box-slim');
            expect(mockHeroBannerLightBox).toHaveBeenNthCalledWith(1, {
                fields: mockProps.fields,
                experiment: beachExperimentMock,
                onClick: mockProps.handleClickButton,
            });
            expect(mockHeroBannerLightBox).toHaveBeenNthCalledWith(2, {
                fields: mockProps.fields,
                experiment: beachExperimentMock,
                onClick: mockProps.handleClickButton,
                isSecondBox: true,
            });
            expect(mockCreditAnchor).toHaveBeenCalledWith({
                fields: mockProps.fields,
                isPillStyle: true,
            });
        });

        it('should render TwoBoxes Variant', () => {
            mockProps.fields.Variant.value = GenericHeroBannerVariant.TwoBoxes;

            render(<HeroBannerContent {...mockProps} />);
            expect(mockRichTextWithLinks).toHaveBeenCalledWith({
                field: mockProps.fields.Title,
                className: 'hero-banner__title',
                tag: 'h2',
            });

            expect(screen.getByTestId('hero-banner-content')).toHaveClass('content');
            expect(mockBannerTwinBox).toHaveBeenNthCalledWith(1, {
                fields: mockProps.fields,
                experiment: beachExperimentMock,
                onClick: mockProps.handleClickButton,
            });

            expect(mockBannerTwinBox).toHaveBeenNthCalledWith(2, {
                fields: mockProps.fields,
                experiment: beachExperimentMock,
                onClick: mockProps.handleClickButton,
                isSecondBox: true,
            });
        });

        it('should render OpaqueWhiteStripe Variant', () => {
            mockProps.fields.Variant.value = GenericHeroBannerVariant.OpaqueWhiteStripe;

            render(<HeroBannerContent {...mockProps} />);

            expect(mockHeroBannerStripeBox).toHaveBeenCalledWith({
                fields: mockProps.fields,
                experiment: beachExperimentMock,
                onClick: mockProps.handleClickButton,
            });
        });

        it('should render TranslucentWhiteStripe Variant', () => {
            mockProps.fields.Variant.value = GenericHeroBannerVariant.TranslucentWhiteStripe;

            render(<HeroBannerContent {...mockProps} />);

            expect(mockHeroBannerStripeBox).toHaveBeenCalledWith({
                fields: mockProps.fields,
                experiment: beachExperimentMock,
                onClick: mockProps.handleClickButton,
            });
        });

        it('should render UnboundedBrand Variant', () => {
            mockProps.fields.Variant.value = GenericHeroBannerVariant.UnboundedBrand;

            render(<HeroBannerContent {...mockProps} />);

            expect(mockHeroBannerUnboundedBrand).toHaveBeenCalledWith({
                fields: mockProps.fields,
                experiment: beachExperimentMock,
                onClick: mockProps.handleClickButton,
            });
        });

        it('should render LightboxWithRoundel Variant', () => {
            mockProps.fields.Variant.value = GenericHeroBannerVariant.LightboxWithRoundel;

            render(<HeroBannerContent {...mockProps} />);

            expect(mockHeroBannerLightboxWithRoundel).toHaveBeenCalledWith({
                fields: mockProps.fields,
                experiment: beachExperimentMock,
                onClick: mockProps.handleClickButton,
            });
            expect(screen.getByTestId('hero-banner-lightbox-with-roundel')).toBeInTheDocument();
        });
    });
});
