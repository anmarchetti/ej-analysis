import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import ItineraryFeature, { IItineraryFeatureProps } from './ItineraryFeature';

const createProps = (): IItineraryFeatureProps => ({
    description: mockSitecoreField('description'),
    dataTid: 'data-tid',
    title: mockSitecoreField('title'),
    icon: mockSitecoreField(mockSitecoreImageField('icon')),
    isExpanded: false,
});

const mockJSSImageNext = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageNext(props);

        return <div data-tid='jss-image-next' />;
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

let props: IItineraryFeatureProps;

describe('<ItineraryAirport />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render itinerary airport item component with booking full flight data', () => {
        render(<ItineraryFeature {...props} />);

        expect(screen.getByTestId(`itinerary-feature-${props.dataTid}`)).toBeInTheDocument();
        expect(screen.getByTestId(`itinerary-feature-${props.dataTid}-heading`)).toBeInTheDocument();
        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
            field: props.title,
            tag: 'span',
        });
        expect(mockTextComponent).not.toHaveBeenCalledTimes(2);
    });

    describe('expanded mode', () => {
        beforeEach(() => {
            props.isExpanded = true;
        });

        it('should render expanded content', () => {
            render(<ItineraryFeature {...props} />);

            expect(screen.getByTestId(`itinerary-feature-${props.dataTid}`)).toHaveClass('expanded');
            expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
                field: props.title,
                tag: 'span',
            });
            expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
                field: props.description,
                tag: 'span',
                className: expect.any(String),
            });
        });

        it('should not render tooltip when tooltipText is null', () => {
            render(<ItineraryFeature {...props} />);
            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
            expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument();
            expect(mockTooltip).not.toHaveBeenCalled();
            expect(mockTooltipContent).not.toHaveBeenCalled();
        });

        it('should render tooltip when tooltipText is provided', () => {
            props.tooltipText = 'tooltip text';
            render(<ItineraryFeature {...props} />);

            expect(screen.getByTestId('tooltip')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
            expect(mockTooltip).toHaveBeenCalled();
            expect(mockTooltipContent).toHaveBeenCalledWith({
                text: 'tooltip text',
            });
        });
    });
});
