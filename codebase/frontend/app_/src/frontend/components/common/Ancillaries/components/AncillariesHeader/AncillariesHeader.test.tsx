import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AncillariesHeader, { TAncillariesHeaderProps } from './AncillariesHeader';

const createProps = (): TAncillariesHeaderProps => ({
    title: mockSitecoreField('title'),
    description: mockSitecoreField('description'),
    dataTid: 'ancillaries-header',
});

let mockProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextComponent(props);

        return <div data-tid={props['data-tid']} />;
    },
}));

describe('<AncillariesHeader />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render component', () => {
        render(<AncillariesHeader {...mockProps} />);

        expect(screen.getByTestId('ancillaries-header')).toHaveClass('head');
        expect(screen.getByTestId('ancillaries-header')).not.toHaveClass('headPostBooking');

        expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
            field: mockProps.title,
            tag: 'h2',
            className: 'title',
            'data-tid': 'ancillaries-header-title',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
            field: mockProps.description,
            tag: 'span',
            'data-tid': 'ancillaries-header-subtitle',
        });
    });

    it('should render component with right class on post booking pages', () => {
        mockStores.layoutStore.isPostBookingPages = true;
        render(<AncillariesHeader {...mockProps} />);

        expect(screen.getByTestId('ancillaries-header')).toHaveClass('head headPostBooking');
    });

    it('should render component with default data test id when it is NOT provided in props', () => {
        mockProps.dataTid = undefined;
        render(<AncillariesHeader {...mockProps} />);

        expect(screen.getByTestId('title')).toBeInTheDocument();
    });
});
