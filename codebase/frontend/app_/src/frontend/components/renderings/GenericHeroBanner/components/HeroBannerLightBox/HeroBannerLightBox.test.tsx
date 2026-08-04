import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { defaultExperimentMock } from 'frontend/__mocks__/experiments';
import { cta2Mock, ctaMock, getMockedBannerFields } from 'frontend/__mocks__/heroBanners';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { getHeroBannerControls } from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

import HeroBannerLightBox, { IHeroBannerLightBoxProps } from './HeroBannerLightBox';

jest.mock('frontend/components/renderings/GenericHeroBanner/heroBanner.utils', () => ({
    getHeroBannerControls: jest.fn(),
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
    default: (props: any) => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-link' />;
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

const createProps = (): IHeroBannerLightBoxProps => ({
    experiment: defaultExperimentMock,
    fields: {
        ...getMockedBannerFields(),
        CTA2: cta2Mock,
        Subtitle2: mockSitecoreField('Subtitle2'),
        TextBeforeNumber2: mockSitecoreField('#'),
    },
    onClick: jest.fn(),
    isSecondBox: false,
});

let mockProps: IHeroBannerLightBoxProps = createProps();

describe('<HeroBannerLightBox />', () => {
    beforeEach(() => {
        mockProps = createProps();
        (getHeroBannerControls as jest.Mock).mockReturnValue([ctaMock, cta2Mock]);
    });

    it('should render first box correctly', () => {
        render(<HeroBannerLightBox {...mockProps} />);

        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            className: 'hero-banner__subtitle',
            field: mockProps.fields.Subtitle,
            tag: 'div',
        });

        expect(mockTextComponent).toHaveBeenCalledWith({
            className: 'hero-banner__description',
            field: mockProps.fields.TextBeforeNumber,
            tag: 'p',
        });

        expect(mockRouterLink).toHaveBeenCalledWith({
            children: ctaMock.value.text,
            link: ctaMock,
            className: 'content btn hero-banner__btn',
        });
    });

    it('should handle first box button click', async () => {
        render(<HeroBannerLightBox {...mockProps} />);

        const button = screen.getByTestId('router-link');

        await userEvent.click(button);

        expect(mockProps.onClick).toHaveBeenCalledWith(expect.any(Object), ctaMock);
    });

    it('should render second box correctly', () => {
        render(<HeroBannerLightBox {...mockProps} isSecondBox />);

        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            className: 'hero-banner__subtitle',
            field: mockProps.fields.Subtitle2,
            tag: 'div',
        });

        expect(mockTextComponent).toHaveBeenCalledWith({
            className: 'hero-banner__description',
            field: mockProps.fields.TextBeforeNumber2,
            tag: 'p',
        });

        expect(mockRouterLink).toHaveBeenCalledWith({
            children: 'have second great holiday',
            link: cta2Mock,
            className: 'content btn hero-banner__btn',
        });
    });

    it('should handle second box button click', async () => {
        render(<HeroBannerLightBox {...mockProps} isSecondBox />);

        const button = screen.getByTestId('router-link');

        await userEvent.click(button);

        expect(mockProps.onClick).toHaveBeenCalledWith(expect.any(Object), cta2Mock);
    });

    it('should NOT render subtitle when subtitle value is empty', () => {
        mockProps.fields.Subtitle = undefined;

        render(<HeroBannerLightBox {...mockProps} />);

        expect(mockRichTextWithLinks).not.toHaveBeenCalledWith({
            className: 'hero-banner__subtitle',
            field: mockProps.fields.Subtitle,
            tag: 'div',
        });
    });

    it('should NOT render description when description value is empty', () => {
        mockProps.fields.TextBeforeNumber = mockSitecoreField('');

        render(<HeroBannerLightBox {...mockProps} />);

        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            className: 'hero-banner__subtitle hero-banner__subtitle-without-description',
            field: mockProps.fields.Subtitle,
            tag: 'div',
        });

        expect(mockTextComponent).not.toHaveBeenCalledWith({
            className: 'hero-banner__description',
            field: mockProps.fields.TextBeforeNumber2,
            tag: 'p',
        });
    });

    it('should NOT render button when button href is empty', () => {
        (getHeroBannerControls as jest.Mock).mockReturnValue([{}, {}]);

        render(<HeroBannerLightBox {...mockProps} />);

        expect(screen.queryByTestId('hero-banner-btn')).not.toBeInTheDocument();
    });
});
