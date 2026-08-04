import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { beachExperimentMock } from 'frontend/__mocks__/experiments';
import { cta2Mock, ctaMock } from 'frontend/__mocks__/heroBanners';
import BannerCTAType from 'models/enum/banners/CTAType';
import * as bannerUtils from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

import HeroBannerControls, { IHeroBannerControlsProps } from './HeroBannerControls';

const createProps = (): IHeroBannerControlsProps => ({
    controlsFields: [ctaMock, cta2Mock],
    onClick: jest.fn(),
    experiment: beachExperimentMock,
    type: BannerCTAType.Orange,
    isSecondBox: false,
});

let mockProps = createProps();

const mockRouterLink = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockRouterLink(props);

        return <button data-tid='router-link' onClick={onClick} />;
    },
}));

describe('<HeroBannerControls />', () => {
    const getHeroBannerControlsSpy = jest.spyOn(bannerUtils, 'getHeroBannerControls');

    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render with additional control', () => {
        render(<HeroBannerControls {...mockProps} />);

        expect(screen.getAllByTestId('router-link').length).toBe(2);
        expect(mockRouterLink).toHaveBeenNthCalledWith(1, {
            children: ctaMock.value.text,
            link: ctaMock,
            className: 'content btn hero-banner__btn inline orange',
            dataId: 'hero-banner-cta-1',
        });
        expect(mockRouterLink).toHaveBeenNthCalledWith(2, {
            children: cta2Mock.value.text,
            link: cta2Mock,
            className: 'content btn hero-banner__btn inline orange',
            dataId: 'hero-banner-cta-2',
        });
        expect(getHeroBannerControlsSpy).toHaveBeenCalledWith([ctaMock, cta2Mock], beachExperimentMock);
    });

    it('should render default with white theme', () => {
        mockProps.type = BannerCTAType.White;
        mockProps.controlsFields = [ctaMock, undefined];

        render(<HeroBannerControls {...mockProps} />);

        expect(mockRouterLink).toHaveBeenCalledWith({
            children: ctaMock.value.text,
            link: ctaMock,
            className: 'content btn hero-banner__btn inline white',
            dataId: 'hero-banner-cta-1',
        });
        expect(getHeroBannerControlsSpy).toHaveBeenCalledWith([ctaMock], beachExperimentMock);
    });

    it('should handle button click', async () => {
        render(<HeroBannerControls {...mockProps} />);

        const [button] = screen.getAllByTestId('router-link');

        await userEvent.click(button);

        expect(mockProps.onClick).toHaveBeenCalledWith(expect.any(Object), ctaMock, undefined);
    });

    it('should handle button click for second box', async () => {
        mockProps.isSecondBox = true;
        mockProps.controlsFields = [cta2Mock];

        render(<HeroBannerControls {...mockProps} />);

        const [button] = screen.getAllByTestId('router-link');

        await userEvent.click(button);

        expect(mockProps.onClick).toHaveBeenCalledWith(expect.any(Object), cta2Mock, '2');
    });
});
