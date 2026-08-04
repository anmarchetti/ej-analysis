import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BreadItem from './BreadItem';

const createProps = () => ({
    isActive: true,
    isPrev: false,
    title: 'title',
    number: 1,
    href: 'http://href.com',
    onClick: jest.fn(),
});

Object.defineProperty(window, 'NO_ANALYTICS', {
    configurable: true,
    writable: true,
});

const createStore = () => ({
    layoutStore: { basePath: '/en/holidays' },
});

let props;
let mockStore;

window['NO_ANALYTICS'] = false;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));

jest.mock('frontend/components/icons-new/Tick', () => ({
    __esModule: true,
    default: () => <div>SVGTick</div>,
}));

jest.mock('frontend/components/icons-new/FphTick', () => ({
    __esModule: true,
    default: () => <div>FphTick</div>,
}));

jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children }) => (
        <div>
            <span>Link</span>
            <span>{children}</span>
        </div>
    ),
}));

describe('<BreadItem />', () => {
    beforeEach(() => {
        props = createProps();
        mockStore = createStore();
    });

    it('should render passed props in active state', () => {
        render(<BreadItem {...props} />);

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByTestId('step-1')).toBeInTheDocument();
    });

    it('should render passed props as previous item', () => {
        props.isPrev = true;

        render(<BreadItem {...props} />);

        expect(screen.getByText('SVGTick')).toBeInTheDocument();
        expect(screen.getByText('Link')).toBeInTheDocument();
        expect(screen.getByTestId('step-1')).toBeInTheDocument();
    });

    it('should NOT render Link tag if NO_ANALYTICS=true', () => {
        props.isPrev = true;
        window['NO_ANALYTICS'] = true;

        render(<BreadItem {...props} />);

        expect(screen.queryByText('Link')).not.toBeInTheDocument();
    });

    it('should render Link tag if NO_ANALYTICS=false', () => {
        props.isPrev = true;
        window['NO_ANALYTICS'] = false;

        render(<BreadItem {...props} />);

        expect(screen.queryByText('Link')).toBeInTheDocument();
    });

    it('should not render icon in disable state', () => {
        props.isActive = false;

        render(<BreadItem {...props} />);

        expect(screen.queryByText('SVGTick')).not.toBeInTheDocument();
    });

    describe('href handling with NO_ANALYTICS', () => {
        beforeEach(() => {
            props.isPrev = true;
            mockStore.layoutStore.basePath = '/en/holidays';
        });

        it('should NOT prepend basePath to href when NO_ANALYTICS=true and href starts with http', () => {
            props.href = 'https://fph-ci.webdev.ejholidays.ejcloud.net/en/flight-plus-hotel/hotels';
            window['NO_ANALYTICS'] = true;

            render(<BreadItem {...props} />);

            const link = screen.getByTestId('step-1');
            expect(link.getAttribute('href')).toBe(
                'https://fph-ci.webdev.ejholidays.ejcloud.net/en/flight-plus-hotel/hotels',
            );
        });

        it('should prepend basePath to href when NO_ANALYTICS=true and href is relative', () => {
            props.href = '/extras?param=value';
            window['NO_ANALYTICS'] = true;

            render(<BreadItem {...props} />);

            const link = screen.getByTestId('step-1');
            expect(link.getAttribute('href')).toBe('/en/holidays/extras?param=value');
        });

        it('should NOT prepend basePath when NO_ANALYTICS=true and href already starts with basePath', () => {
            props.href = '/en/holidays/extras';
            window['NO_ANALYTICS'] = true;

            render(<BreadItem {...props} />);

            const link = screen.getByTestId('step-1');
            expect(link.getAttribute('href')).toBe('/en/holidays/extras');
        });

        it('should use Link component when NO_ANALYTICS=false regardless of href type', () => {
            props.href = 'https://fph-ci.webdev.ejholidays.ejcloud.net/en/flight-plus-hotel/hotels';
            window['NO_ANALYTICS'] = false;

            render(<BreadItem {...props} />);

            expect(screen.queryByText('Link')).toBeInTheDocument();
        });
    });

    describe('Flight Plus Hotel funnel icons', () => {
        beforeEach(() => {
            props.isPrev = true;
        });

        it('should render FphTick icon when isFlightPlusHotelFunnel is true', () => {
            props.isFlightPlusHotelFunnel = true;

            render(<BreadItem {...props} />);

            expect(screen.getByText('FphTick')).toBeInTheDocument();
        });

        it('should render SVGTick icon when isFlightPlusHotelFunnel is false or undefined', () => {
            props.isFlightPlusHotelFunnel = false;

            render(<BreadItem {...props} />);

            expect(screen.getByText('SVGTick')).toBeInTheDocument();
        });
    });

    describe('Popup functionality', () => {
        beforeEach(() => {
            props.isPrev = true;
            window['NO_ANALYTICS'] = false;
        });

        it('should render button instead of Link when onPopupAction exists', () => {
            props.onPopupAction = jest.fn();

            render(<BreadItem {...props} />);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute('data-tid', 'step-1');
            expect(button).toHaveClass('bread-item', 'bread-item--ready');

            expect(screen.queryByText('Link')).not.toBeInTheDocument();
        });

        it('should call onPopupAction when button is clicked', async () => {
            const mockOnPopupAction = jest.fn();
            props.onPopupAction = mockOnPopupAction;
            props.onClick = jest.fn();

            render(<BreadItem {...props} />);

            const button = screen.getByRole('button');
            await userEvent.click(button);

            expect(mockOnPopupAction).toHaveBeenCalledTimes(1);
            expect(props.onClick).not.toHaveBeenCalled();
        });

        it('should render correct content inside button (icon + title)', () => {
            props.onPopupAction = jest.fn();

            render(<BreadItem {...props} />);

            const button = screen.getByRole('button');

            expect(screen.getByText('SVGTick')).toBeInTheDocument();

            expect(button).toHaveTextContent('title');
        });

        it('should render Link when onPopupAction is undefined', () => {
            props.onPopupAction = undefined;

            render(<BreadItem {...props} />);

            expect(screen.getByText('Link')).toBeInTheDocument();
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

        it('should NOT render button when isPrev is false (even if onPopupAction exists)', () => {
            props.isPrev = false;
            props.isActive = true;
            props.shouldShowPopup = true;
            props.onPopupAction = jest.fn();

            render(<BreadItem {...props} />);

            const element = screen.getByTestId('step-1');
            expect(element.tagName).toBe('DIV');

            expect(screen.queryByRole('button')).not.toBeInTheDocument();
            expect(screen.queryByText('Link')).not.toBeInTheDocument();
        });

        it('should render FphTick icon in button when isFlightPlusHotelFunnel is true', () => {
            props.onPopupAction = jest.fn();
            props.isFlightPlusHotelFunnel = true;

            render(<BreadItem {...props} />);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            expect(screen.getByText('FphTick')).toBeInTheDocument();
        });
    });
});
