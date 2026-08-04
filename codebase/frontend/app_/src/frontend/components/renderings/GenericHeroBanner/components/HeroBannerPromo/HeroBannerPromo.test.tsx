import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ctaMock, getMockedBannerFields } from 'frontend/__mocks__/heroBanners';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import HeroBannerPromo from './HeroBannerPromo';

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

const createProps = () => ({
    fields: getMockedBannerFields(),
    onClickLink: jest.fn(),
});

let mockProps;

describe('<HeroBannerPromo />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render default', () => {
        render(<HeroBannerPromo {...mockProps} />);

        expect(mockJssImage).toHaveBeenCalledWith({
            field: mockProps.fields.PromoLogo,
        });

        expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
            field: mockProps.fields.TopText,
            tag: 'div',
        });
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
            tag: 'small',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(5, {
            field: mockProps.fields.BottomText,
            tag: 'span',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(6, {
            field: mockProps.fields.BottomLinedText,
            tag: 'div',
            className: 'hero-banner__promo-footer',
        });

        expect(mockRouterLink).toHaveBeenCalledWith({
            children: ctaMock.value.text,
            link: ctaMock,
            className: 'content btn',
        });
    });

    it('should NOT render price fields when they are undefined', () => {
        mockProps.fields.NumberValue = mockSitecoreField('');
        mockProps.fields.TextAfterNumber = mockSitecoreField('');

        render(<HeroBannerPromo {...mockProps} />);

        expect(mockTextComponent).not.toHaveBeenCalledWith({
            field: mockProps.fields.NumberValue,
            tag: 'span',
        });
        expect(mockTextComponent).not.toHaveBeenCalledWith({
            field: mockProps.fields.TextAfterNumber,
            tag: 'small',
        });
    });

    it('should skip render when fields undefined', () => {
        mockProps.fields = {};

        const { container } = render(<HeroBannerPromo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should handle link click', async () => {
        render(<HeroBannerPromo {...mockProps} />);

        const button = screen.getByTestId('router-link');

        await userEvent.click(button);

        expect(mockProps.onClickLink).toHaveBeenCalled();
    });
});
