import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PillColourVariant } from 'models/data/IFullWithBanner';

import FullWidthBannerPill, { IFullWidthBannerPillProps } from './FullWidthBannerPill';

const createProps = (): IFullWidthBannerPillProps => ({
    PillColour: PillColourVariant.Green,
    PillText: mockSitecoreField('text'),
    className: 'test',
});

let mockProps: IFullWidthBannerPillProps;

const mockPricePillProps = jest.fn();
jest.mock('frontend/components/common/Pills/PricePill/PricePill', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockPricePillProps(props);

        return <div data-tid='banner-price-pill'>{children}</div>;
    },
}));

describe('<FullWidthBannerPill />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render pill when PillText is empty string', () => {
        mockProps.PillText!.value = '';

        const { container } = render(<FullWidthBannerPill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render red pill when PillColour param is equal to Red', () => {
        mockProps.PillColour = PillColourVariant.Red;

        render(<FullWidthBannerPill {...mockProps} />);

        expect(screen.getByTestId('banner-price-pill')).toHaveTextContent('text');
        expect(mockPricePillProps).toHaveBeenCalledWith({
            isRed: true,
            isYellow: false,
            isGreen: false,
            isBlack: false,
            className: 'test',
        });
    });

    it('should render yellow pill when PillColour param is equal to Yellow', () => {
        mockProps.PillColour = PillColourVariant.Yellow;

        render(<FullWidthBannerPill {...mockProps} />);

        expect(mockPricePillProps).toHaveBeenCalledWith({
            isRed: false,
            isYellow: true,
            isGreen: false,
            isBlack: false,
            className: 'test',
        });
    });

    it('should render black pill when PillColour param is equal to Black', () => {
        mockProps.PillColour = PillColourVariant.Black;

        render(<FullWidthBannerPill {...mockProps} />);

        expect(mockPricePillProps).toHaveBeenCalledWith({
            isRed: false,
            isYellow: false,
            isGreen: false,
            isBlack: true,
            className: 'test',
        });
    });

    it('Should render green pill when PillColour param is not defined', () => {
        mockProps.PillColour = undefined;
        mockProps.className = undefined;

        render(<FullWidthBannerPill {...mockProps} />);

        expect(mockPricePillProps).toHaveBeenCalledWith({
            isRed: false,
            isYellow: false,
            isGreen: true,
            isBlack: false,
            className: '',
        });
    });
});
