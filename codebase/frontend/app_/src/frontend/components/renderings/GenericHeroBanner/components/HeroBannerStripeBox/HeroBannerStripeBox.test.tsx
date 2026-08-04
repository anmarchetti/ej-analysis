import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { defaultExperimentMock } from 'frontend/__mocks__/experiments';
import { ctaMock, getMockedBannerFields } from 'frontend/__mocks__/heroBanners';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { getHeroBannerControls } from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

import HeroBannerStripeBox from './HeroBannerStripeBox';

jest.mock('frontend/components/renderings/GenericHeroBanner/heroBanner.utils', () => ({
    getHeroBannerControls: jest.fn(),
}));

const mockJssImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJssImage(props);

        return <div data-tid='jss-image' />;
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

const mockRouterLink = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockRouterLink(props);

        return <button data-tid='router-link' onClick={onClick} />;
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

const mockHeroBannerHeader = jest.fn();
jest.mock('frontend/components/renderings/GenericHeroBanner/components/HeroBannerHeader/HeroBannerHeader', () => ({
    __esModule: true,
    default: props => {
        mockHeroBannerHeader(props);

        return <div data-tid='hero-banner-header' />;
    },
}));

const createProps = () => ({
    experiment: defaultExperimentMock,
    fields: getMockedBannerFields(),
    onClick: jest.fn(),
});

let mockProps;

describe('HeroBannerStripeBox', () => {
    beforeEach(() => {
        mockProps = createProps();
        (getHeroBannerControls as jest.Mock).mockReturnValue([ctaMock]);
    });

    it('should render default', () => {
        render(<HeroBannerStripeBox {...mockProps} />);

        expect(screen.getByTestId('hero-banner-content')).toHaveClass('hero-banner__stripe-content');

        expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
            field: mockProps.fields.TopText,
            tag: 'span',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
            field: mockProps.fields.TextBeforeNumber,
            tag: 'span',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(3, {
            className: 'hero-banner__total',
            field: mockProps.fields.NumberValue,
            tag: 'span',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(4, {
            field: mockProps.fields.TextAfterNumber,
            tag: 'span',
        });

        expect(mockRouterLink).toHaveBeenNthCalledWith(1, {
            children: ctaMock.value.text,
            link: ctaMock,
            className: 'content btn hero-banner__btn',
        });

        expect(mockJssImage).toHaveBeenCalledWith({
            field: mockProps.fields!.PromoLogo,
        });

        expect(mockHeroBannerHeader).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });

        expect(mockCreditAnchor).toHaveBeenCalledWith({
            fields: mockProps.fields,
            isPillStyle: true,
            className: 'content',
        });
    });

    describe('logo section', () => {
        it('should display logo section when TopText only provided', () => {
            mockProps.fields.PromoLogo = mockSitecoreField({});

            render(<HeroBannerStripeBox {...mockProps} />);

            expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
            expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
                field: mockProps.fields.TopText,
                tag: 'span',
            });
        });

        it('should display logo section when PromoLogo only provided', () => {
            mockProps.fields.TopText = mockSitecoreField('');

            render(<HeroBannerStripeBox {...mockProps} />);

            expect(mockJssImage).toHaveBeenCalledWith({
                field: mockProps.fields!.PromoLogo,
            });
        });

        it('should NOT display the logo section when neither PromoLogo nor TopText are provided', () => {
            mockProps.fields.PromoLogo = mockSitecoreField({});
            mockProps.fields.TopText = mockSitecoreField('');

            render(<HeroBannerStripeBox {...mockProps} />);

            expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
            expect(mockTextComponent).not.toHaveBeenCalledWith({
                field: mockProps.fields.TopText,
                tag: 'span',
            });
        });
    });

    it('should call onClick when button clicked', async () => {
        render(<HeroBannerStripeBox {...mockProps} />);

        const button = screen.getByTestId('router-link');

        await userEvent.click(button);

        expect(mockProps.onClick).toHaveBeenCalledWith(expect.any(Object), ctaMock);
    });

    it('should NOT display the button when the first control does NOT have a href', () => {
        (getHeroBannerControls as jest.Mock).mockReturnValue([mockSitecoreField({ text: 'No Link' })]);

        render(<HeroBannerStripeBox {...mockProps} />);

        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
    });
});
