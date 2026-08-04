import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import { CalendarFilterDrawer, IFiltersContainerProps } from './CalendarFilterDrawer';

jest.mock('./SelectMonthYear', () => ({
    __esModule: true,
    default: () => <div data-tid='select-month-year' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Drawer', () => props => <div data-tid={props.dataTid}>{props.children}</div>);

jest.mock('frontend/components/common/FakeInput/FakeInput', () => ({ onClick, value, placeholder }) => (
    <>
        <input data-tid='fake-input' onClick={onClick} value={value} />
        <span data-tid='fake-input-placeholder'>{placeholder}</span>
    </>
));

const resetMocks = (): IFiltersContainerProps => ({
    id: 'id',
    label: 'label',
    placeholder: 'placeholder',
    value: new Date(),
    isDrawerActive: false,
    minDate: new Date(2020, 0, 1),
    maxDate: new Date(),
    onCancel: jest.fn(),
    onApply: jest.fn(),
    onChange: jest.fn(),
});

let mockStores;
let mocks;

describe('<DateFilter />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({
            mediaCenterStore: {
                formatDateDMY: jest.fn(d => d),
            },
        });
    });

    it('should render CalendarFilterDrawer', () => {
        render(<CalendarFilterDrawer {...mocks} />);
        expect(screen.getByTestId('calendar-filter-drawer')).toBeInTheDocument();
        expect(screen.getByTestId('select-month-year')).toBeInTheDocument();
        expect(screen.getByTestId('drawer-actions')).toBeInTheDocument();
        expect(screen.getByTestId('fake-input')).toBeInTheDocument();
        expect(screen.getByTestId('fake-input-placeholder')).toHaveTextContent(mocks.placeholder);
        expect(screen.getByTestId('fake-input')).toHaveValue(mocks.value.toString());
    });

    it('should render Close and Apply buttons', () => {
        render(<CalendarFilterDrawer {...mocks} />);
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });
});
