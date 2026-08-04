import React from 'react';
import { render, screen } from '@testing-library/react';

import { defaultExperimentMock } from 'frontend/__mocks__/experiments';
import { getMockedBannerFields } from 'frontend/__mocks__/heroBanners';

import HeroBannerMultiMessage, { IHeroBannerHeroBannerMultiMessageProps } from './HeroBannerMultiMessage';

const mockBoxWithRoundel = jest.fn();
jest.mock('frontend/components/renderings/GenericHeroBanner/components/BoxWithRoundel/BoxWithRoundel', () => ({
    __esModule: true,
    default: props => {
        mockBoxWithRoundel(props);

        return <div data-tid='box-with-roundel' />;
    },
}));

jest.mock('frontend/components/renderings/GenericHeroBanner/components/HeroBannerImages/HeroBannerImages', () => ({
    __esModule: true,
    default: () => <div data-tid='hero-banner-images' />,
}));

const mockCreditAnchor = jest.fn();
jest.mock('frontend/components/common/CreditAnchor/CreditAnchor', () => ({
    __esModule: true,
    default: props => {
        mockCreditAnchor(props);

        return <div data-tid='credit-anchor' />;
    },
}));

const createProps = (): IHeroBannerHeroBannerMultiMessageProps => ({
    experiment: defaultExperimentMock,
    fields: getMockedBannerFields(),
    onClick: jest.fn(),
});

let mockProps: IHeroBannerHeroBannerMultiMessageProps;

describe('HeroBannerMultiMessage', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render default', () => {
        render(<HeroBannerMultiMessage {...mockProps} />);

        expect(screen.getByTestId('hero-banner-images')).toBeInTheDocument();
        expect(screen.getAllByTestId('box-with-roundel').length).toBe(3);
        expect(screen.getByTestId('credit-anchor')).toBeInTheDocument();

        expect(mockBoxWithRoundel).toHaveBeenNthCalledWith(1, {
            fields: mockProps.fields,
            experiment: mockProps.experiment,
            onClick: mockProps.onClick,
            className: 'mainBox',
            isMainBox: true,
        });

        expect(mockBoxWithRoundel).toHaveBeenNthCalledWith(2, {
            fields: {
                ...mockProps.fields,
                TextBeforeNumber: mockProps.fields.TextBeforeNumber2,
                NumberValue: mockProps.fields.NumberValue2,
                TextAfterNumber: mockProps.fields.TextAfterNumber2,
                CTA: mockProps.fields.CTA2,
                Title: mockProps.fields.Subtitle2,
                Subtitle: mockProps.fields.ExtraContent2,
            },
            experiment: mockProps.experiment,
            onClick: mockProps.onClick,
            className: 'secondBox',
            isSecondaryBox: true,
        });

        expect(mockBoxWithRoundel).toHaveBeenNthCalledWith(3, {
            fields: {
                ...mockProps.fields,
                TextBeforeNumber: mockProps.fields.TextBeforeNumber3,
                NumberValue: mockProps.fields.NumberValue3,
                TextAfterNumber: mockProps.fields.TextAfterNumber3,
                CTA: mockProps.fields.CTA3,
                Title: mockProps.fields.Subtitle3,
                Subtitle: mockProps.fields.ExtraContent3,
            },
            experiment: mockProps.experiment,
            onClick: mockProps.onClick,
            className: 'thirdBox',
            isSecondaryBox: true,
        });

        expect(mockCreditAnchor).toHaveBeenCalledWith({
            fields: mockProps.fields,
            isPillStyle: true,
            className: 'credit',
        });
    });
});
