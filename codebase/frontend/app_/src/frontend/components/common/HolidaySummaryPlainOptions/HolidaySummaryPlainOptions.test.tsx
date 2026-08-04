import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores as createDefaultMockStores, mockAmendDatesStore } from 'frontend/__mocks__';
import { IHolidaysStores } from 'frontend/store/holidays';
import { GuestType } from 'models/enum/GuestType';

import HolidaySummaryPlainOptions from './HolidaySummaryPlainOptions';

expect.extend(toHaveNoViolations);

const createProps = () => ({
    guestsCount: {
        [GuestType.Adult]: 2,
        [GuestType.Child]: 1,
        [GuestType.Infant]: 1,
    },
    isPrevious: false,
    dataTid: 'data-tid',
});

const createMockStores = () =>
    createDefaultMockStores({
        amendDatesStore: mockAmendDatesStore,
    } as IHolidaysStores);

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockImageFilterProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    SVGFilterMatrix: {
        Grayscale: 'grayscale',
        Orange: 'orange',
    },
    default: props => {
        mockImageFilterProps(props);

        return <div data-tid='image-with-filter' />;
    },
}));

describe('<HolidaySummaryPlainOptions />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Render all enabled options labels', () => {
        const { container } = render(<HolidaySummaryPlainOptions {...mockProps} />);

        expect(screen.getByTestId('data-tid')).toBeInTheDocument();
        expect(screen.getByTestId('data-tid-icon-0')).toBeInTheDocument();
        expect(screen.getByTestId('data-tid-icon-1')).toBeInTheDocument();
        expect(screen.getByTestId('data-tid-icon-2')).toBeInTheDocument();
        expect(screen.getByTestId('data-tid-title-0')).toHaveTextContent('2 x Globals.labels.adults');
        expect(screen.getByTestId('data-tid-title-1')).toHaveTextContent('1 x Globals.labels.child');
        expect(screen.getByTestId('data-tid-title-2')).toHaveTextContent('1 x Globals.labels.infant');
        expect(container.querySelector('.plain-options')).toBeInTheDocument();
    });

    it('Render null if no options', () => {
        mockProps.guestsCount = {
            [GuestType.Adult]: 0,
            [GuestType.Child]: 0,
            [GuestType.Infant]: 0,
        };
        const { container } = render(<HolidaySummaryPlainOptions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HolidaySummaryPlainOptions {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
