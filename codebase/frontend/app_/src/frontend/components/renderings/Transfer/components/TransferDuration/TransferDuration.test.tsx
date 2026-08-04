import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import TransferDuration, { ITransferDurationProps } from './TransferDuration';

const createProps = (): ITransferDurationProps => ({
    duration: 1,
    className: 'test',
    hideOnDesktop: false,
    hideOnMobile: false,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/AccessTime', () => () => <div data-tid='access-time' />);

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: ({ content, ...props }) => {
        mockCalloutProps(props);

        return <div data-tid='callout'>{content}</div>;
    },
}));

describe('<TransferDuration />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render default component', () => {
        render(<TransferDuration {...mockProps} />);

        expect(screen.getByTestId('access-time')).toBeInTheDocument();
        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(mockCalloutProps).toHaveBeenCalledWith({
            orientation: CalloutOrientation.Top,
            position: CalloutPosition.Center,
            className: 'callout',
            isShownOnHover: true,
        });

        expect(screen.getByText(SitecoreDictionary.TransferLabelsDurationTitle)).toBeInTheDocument();

        const duration = screen.getByTestId('transfer-duration');
        expect(duration).toHaveClass('container test');
        expect(duration).not.toHaveClass('hideOnDesktop');
        expect(duration).not.toHaveClass('hideOnMobile');
    });

    it('should render component with hideOnDesktop className when hideOnDesktop is true', () => {
        mockProps.hideOnDesktop = true;

        render(<TransferDuration {...mockProps} />);

        expect(screen.getByTestId('transfer-duration')).toHaveClass('hideOnDesktop');
    });

    it('should render component with hideOnMobile className when hideOnMobile is true', () => {
        mockProps.hideOnMobile = true;

        render(<TransferDuration {...mockProps} />);

        expect(screen.getByTestId('transfer-duration')).toHaveClass('hideOnMobile');
    });
});
