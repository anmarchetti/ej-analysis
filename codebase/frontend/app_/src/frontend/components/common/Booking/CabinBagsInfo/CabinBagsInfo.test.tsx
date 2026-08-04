import { render, screen } from '@testing-library/react';

import { guestsAmountByTypeMock } from 'frontend/__mocks__';
import { mockCabinBagsInfoFields } from 'frontend/__mocks__/cabinBags';

import CabinBagsInfo, { ICabinBagsInfoProps } from './CabinBagsInfo';

const includedLineMock = {
    field: mockCabinBagsInfoFields.IncludedIcon,
    className: 'icon',
    'data-tid': 'included-bag-icon',
};

const createProps = (): ICabinBagsInfoProps => ({
    LCBCount: 2,
    fields: { ...mockCabinBagsInfoFields },
    guestsAmountByType: {
        adults: 2,
        children: 0,
        infants: 0,
    },
    bagTypeClassName: 'bagType',
    iconClassName: 'icon',
    showSpeedyBoardingTooltip: false,
});

let mockProps = createProps();

const mockJSSImage = jest.fn();

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockTooltip = jest.fn();
const mockTooltipContent = jest.fn();
jest.mock('frontend/components/common/Tooltip', () => ({
    Tooltip: ({ children, ...props }) => {
        mockTooltip(props);

        return <div data-tid='tooltip'>{children}</div>;
    },
    TooltipContent: ({ ...props }) => {
        mockTooltipContent(props);

        return <div data-tid='tooltip-content' />;
    },
    TooltipTrigger: ({ children }) => <div data-tid='tooltip-trigger'>{children}</div>,
}));

const mockUseLuxuryInternalFlight = jest.fn().mockReturnValue(false);
jest.mock('frontend/hooks/useLuxuryInternalFlight', () => ({
    useLuxuryInternalFlight: () => mockUseLuxuryInternalFlight(),
}));

describe('<CabinBagsInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render cabin bags info', () => {
        render(<CabinBagsInfo {...mockProps} />);
        expect(screen.getByTestId('cabin-bags-info')).toHaveClass('container');

        const lines = screen.getAllByTestId('lcb-bag-type');
        expect(lines.length).toBe(2);

        expect(lines[0]).toHaveTextContent(mockCabinBagsInfoFields.IncludedBagsLabel.value);
        expect(lines[1]).toHaveTextContent('OverheadBagAddedLabel 2');
        expect(lines[1]).not.toHaveClass('d-none');

        lines.forEach(line => {
            expect(line).toHaveClass('bagType');
        });

        expect(mockJSSImage).toHaveBeenNthCalledWith(1, includedLineMock);
        expect(mockJSSImage).toHaveBeenNthCalledWith(2, {
            field: mockCabinBagsInfoFields.OverheadAddedIcon,
            className: 'icon',
            'data-tid': 'overhead-bag-added-icon',
        });
    });

    it('should not render tooltip when shouldShowTooltip is false', () => {
        render(<CabinBagsInfo {...mockProps} />);
        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument();
        expect(mockTooltip).not.toHaveBeenCalled();
        expect(mockTooltipContent).not.toHaveBeenCalled();
    });

    it('should render tooltip when shouldShowTooltip is true', () => {
        mockProps.showSpeedyBoardingTooltip = true;
        render(<CabinBagsInfo {...mockProps} />);

        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(mockTooltip).toHaveBeenCalled();
        expect(mockTooltipContent).toHaveBeenCalledWith({
            text: 'SpeedyBoardingTooltip',
            className: 'tooltipContent',
        });
    });

    it('should show Included bags line with infant label', () => {
        mockProps.guestsAmountByType = guestsAmountByTypeMock;

        render(<CabinBagsInfo {...mockProps} />);

        const lines = screen.getAllByTestId('lcb-bag-type');
        expect(lines.length).toBe(2);
        expect(lines[0]).toHaveTextContent(mockCabinBagsInfoFields.IncludedWithInfantLabel.value);
        expect(lines[0]).toHaveClass('bagType');
        expect(mockJSSImage).toHaveBeenNthCalledWith(1, includedLineMock);
    });

    it('should hide Added Bags line when LCBCount = 0 ', () => {
        mockProps.LCBCount = 0;

        render(<CabinBagsInfo {...mockProps} />);

        const lines = screen.getAllByTestId('lcb-bag-type');

        expect(lines.length).toBe(2);
        expect(lines[1]).toHaveClass('bagType d-none');
    });

    it('should NOT include bag icon when hideIcon is true', () => {
        mockProps.hideIcon = true;
        render(<CabinBagsInfo {...mockProps} />);

        expect(mockJSSImage).not.toHaveBeenCalled();
    });

    it('should render correct lcb count for luxury internal flights', () => {
        mockUseLuxuryInternalFlight.mockReturnValue(true);
        mockProps.LCBCount = 0;
        mockProps.guestsAmountByType = { adults: 2, children: 1, infants: 0 };

        render(<CabinBagsInfo {...mockProps} />);

        screen.debug();

        const lines = screen.getAllByTestId('lcb-bag-type');
        expect(lines[1]).toHaveTextContent(`OverheadBagAddedLabel 3`);
        expect(lines[1]).not.toHaveClass('d-none');
    });
});
