import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import ViewBookingComponentWrapper, { TViewBookingComponentWrapperProps } from './ViewBookingComponentWrapper';

const createProps = (): TViewBookingComponentWrapperProps => ({
    Icon: mockSitecoreField(mockSitecoreImageField('icon.png')),
    Title: mockSitecoreField('Title'),
    PrimaryButtonText: mockSitecoreField('Primary Button'),
    PrimaryButtonScreenReaderText: mockSitecoreField('Primary Button Screen Reader Text'),
    SecondaryButtonText: mockSitecoreField('Secondary Button'),
    SecondaryButtonScreenReaderText: mockSitecoreField('Secondary Button Screen Reader Text'),
    onPrimaryButtonClick: jest.fn(),
    onSecondaryButtonClick: jest.fn(),
    useMasonryStyle: false,
    dataTid: 'view-booking-component-wrapper',
    children: <div data-tid='child' />,
    bottomChildren: <div data-tid='bottom-child' />,
});

let mockProps = createProps();

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button data-tid={props['data-tid']} onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='jss-text' />;
    },
}));

const mockJSSImageNext = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageNext(props);

        return <div data-tid='jss-image-next' />;
    },
}));

describe('<ViewBookingComponentWrapper />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        render(
            <ViewBookingComponentWrapper {...mockProps}>
                <div data-tid='child' />
            </ViewBookingComponentWrapper>,
        );

        expect(screen.getByTestId('view-booking-component-wrapper')).toBeInTheDocument();

        expect(screen.getAllByTestId('jss-text')).toHaveLength(2);
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.Title,
            tag: 'h2',
            className: 'title',
            'data-tid': 'title',
        });
        expect(mockTextProps).toHaveBeenCalledWith({
            field: undefined,
            tag: 'h3',
            className: 'subtitle',
            'data-tid': 'subtitle',
        });

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSImageNext).toHaveBeenCalledWith({
            className: 'icon',
            field: mockProps.Icon,
            dataTid: 'icon',
            width: 32,
            height: 32,
        });

        expect(screen.getByTestId('primary-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            children: mockProps.PrimaryButtonText!.value,
            onClick: mockProps.onPrimaryButtonClick,
            'data-tid': 'primary-button',
            'aria-label': mockProps.PrimaryButtonScreenReaderText!.value,
            className: 'btn btnPrimary',
        });

        expect(screen.getByTestId('secondary-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            children: mockProps.SecondaryButtonText!.value,
            onClick: mockProps.onSecondaryButtonClick,
            'data-tid': 'secondary-button',
            'aria-label': mockProps.SecondaryButtonScreenReaderText!.value,
            className: 'btn btnSecondary',
            isOutlined: true,
        });

        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByTestId('bottom-child')).toBeInTheDocument();
    });

    it('should NOT render buttons if no button text', () => {
        mockProps.PrimaryButtonText = undefined;
        mockProps.SecondaryButtonText = undefined;
        render(<ViewBookingComponentWrapper {...mockProps} />);

        expect(screen.queryByTestId('button-container')).not.toBeInTheDocument();
    });

    it('should render only primary button if only primary button text provided', () => {
        mockProps.SecondaryButtonText = undefined;
        render(<ViewBookingComponentWrapper {...mockProps} />);

        expect(screen.getByTestId('primary-button')).toBeInTheDocument();
        expect(screen.queryByTestId('secondary-button')).not.toBeInTheDocument();
    });

    it('should render only secondary button if only secondary button text provided', () => {
        mockProps.PrimaryButtonText = undefined;
        render(<ViewBookingComponentWrapper {...mockProps} />);
        expect(screen.queryByTestId('primary-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('secondary-button')).toBeInTheDocument();
    });

    it('should apply masonryItemContainer class when useMasonryStyle is true', () => {
        mockProps.useMasonryStyle = true;
        render(<ViewBookingComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('view-booking-component-wrapper')).toHaveClass('masonryItemContainer');
    });

    it('should NOT apply masonryItemContainer class when useMasonryStyle is undefined', () => {
        mockProps.useMasonryStyle = undefined;
        render(<ViewBookingComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('view-booking-component-wrapper')).not.toHaveClass('masonryItemContainer');
    });
});
