import React from 'react';
import { render, screen } from '@testing-library/react';

import { defaultExperimentMock } from 'frontend/__mocks__/experiments';
import { getMockedBannerFields } from 'frontend/__mocks__/heroBanners';

import HeroBannerLightboxWithRoundel, { IHeroBannerLightboxWithRoundelProps } from './HeroBannerLightboxWithRoundel';

const mockBoxWithRoundel = jest.fn();
jest.mock('frontend/components/renderings/GenericHeroBanner/components/BoxWithRoundel/BoxWithRoundel', () => ({
    __esModule: true,
    default: props => {
        mockBoxWithRoundel(props);

        return <div data-tid='box-with-roundel' />;
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

const createProps = (): IHeroBannerLightboxWithRoundelProps => ({
    experiment: defaultExperimentMock,
    fields: getMockedBannerFields(),
    onClick: jest.fn(),
});

let mockProps: IHeroBannerLightboxWithRoundelProps;

describe('HeroBannerLightboxWithRoundel', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render default', () => {
        render(<HeroBannerLightboxWithRoundel {...mockProps} />);

        expect(screen.getByTestId('box-with-roundel')).toBeInTheDocument();
        expect(screen.getByTestId('credit-anchor')).toBeInTheDocument();

        expect(mockBoxWithRoundel).toHaveBeenCalledWith({
            fields: mockProps.fields,
            experiment: mockProps.experiment,
            onClick: mockProps.onClick,
        });

        expect(mockCreditAnchor).toHaveBeenCalledWith({
            fields: mockProps.fields,
            isPillStyle: true,
            className: 'credit',
        });
    });
});
