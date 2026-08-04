import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import BlockSelected, { IBlockSelectedProps } from './BlockSelected';

expect.extend(toHaveNoViolations);

const createProps: () => IBlockSelectedProps = () => ({
    siteCoreKey: SitecoreDictionary.RoomTypesLabelsSelected,
    dataTid: 'data-tid',
    sitecoreField: undefined,
    customSvg: undefined,
});

let mockStores;
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/Tick', () => ({
    __esModule: true,
    default: () => <div data-tid='svg-default' />,
}));

describe('<BlockSelected />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    describe('sitecore fields', () => {
        it('should render sitecoreKey', () => {
            render(<BlockSelected {...mockProps} />);

            expect(screen.getByTestId('data-tid')).toHaveTextContent('RoomTypes.Labels.Selected');
        });

        it('should render sitecoreKey and sitecoreField', () => {
            mockProps.sitecoreField = { value: 'Test' };

            render(<BlockSelected {...mockProps} />);

            expect(screen.getByTestId('data-tid')).toHaveTextContent('TestRoomTypes.Labels.Selected');
        });

        it('should render sitecoreField', () => {
            mockProps.siteCoreKey = undefined;
            mockProps.sitecoreField = { value: 'Test' };

            render(<BlockSelected {...mockProps} />);

            expect(screen.getByTestId('data-tid')).toHaveTextContent('Test');
        });

        it('should NOT render component when both are missing', () => {
            mockProps.siteCoreKey = undefined;

            const { container } = render(<BlockSelected {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('svg display', () => {
        it('should render default svg when no svg is passed', () => {
            render(<BlockSelected {...mockProps} />);

            expect(screen.getByTestId('svg-default')).toBeInTheDocument();
        });

        it('should render custom svg when svg is passed', () => {
            mockProps.customSvg = <div data-tid='custom-svg' />;

            render(<BlockSelected {...mockProps} />);

            expect(screen.queryByTestId('svg-default')).not.toBeInTheDocument();
            expect(screen.getByTestId('custom-svg')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<BlockSelected {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
