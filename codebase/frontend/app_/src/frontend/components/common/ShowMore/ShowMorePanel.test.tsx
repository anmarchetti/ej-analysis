import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ShowMorePanel from './ShowMorePanel';

const mockComponent = ({ title }) => <div data-tid='items'>{title}</div>;

const createProps = () => ({
    id: 'showMore',
    Component: mockComponent,
    visibleItems: [{ id: 'abc', title: 'visibleItem' }],
    hiddenItems: [{ id: 'abc123', title: 'hiddenItem' }],
    showMoreTitle: 'show more',
    showLessTitle: 'show less',
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(),
    },
});
let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ShowMorePanel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should NOT render if no visible items', () => {
        mockProps.visibleItems = [];
        const { queryByTestId } = render(<ShowMorePanel {...mockProps} />);

        expect(queryByTestId('showMore')).not.toBeInTheDocument();
    });

    it('Should render if there is visible items', () => {
        const { getByTestId } = render(<ShowMorePanel {...mockProps} />);
        expect(getByTestId('showMore')).toBeInTheDocument();
    });

    it('Should render all items in DOM', () => {
        const { queryAllByTestId } = render(<ShowMorePanel {...mockProps} />);
        expect(queryAllByTestId('items').length).toBe(2);
    });

    it('Should render Show More Button', () => {
        const { getByTestId } = render(<ShowMorePanel {...mockProps} />);
        expect(getByTestId('show-button')).toBeInTheDocument();
    });

    it('Should NOT render Show More Button', () => {
        mockProps.hiddenItems = [];
        const { queryByTestId } = render(<ShowMorePanel {...mockProps} />);
        expect(queryByTestId('show-button')).not.toBeInTheDocument();
    });

    it('Should not have open class', () => {
        const { container } = render(<ShowMorePanel {...mockProps} />);
        const hiddenWrapper = container.getElementsByClassName('wrapper')[0];
        expect(hiddenWrapper).not.toHaveClass('open');
    });

    it('Should have open class', async () => {
        const { container, getByRole } = render(<ShowMorePanel {...mockProps} />);
        const hiddenWrapper = container.getElementsByClassName('wrapper')[0];
        await userEvent.click(getByRole('button'));

        expect(hiddenWrapper).toHaveClass('open');
    });
});
