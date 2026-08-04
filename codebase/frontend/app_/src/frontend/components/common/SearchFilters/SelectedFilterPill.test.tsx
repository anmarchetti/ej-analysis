import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ISelectedFilterPillProps, SelectedFilterPill } from './SelectedFilterPill';

describe('SelectedFilterPill', () => {
    const resetMocks = () =>
        ({
            dataTid: 'id',
            label: 'label',
            onRemoveClick: jest.fn(),
            onClick: jest.fn(),
        } as ISelectedFilterPillProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render', () => {
        render(<SelectedFilterPill {...mocks} />);
        const item = screen.getByTestId('id');

        expect(item).toBeInTheDocument();
        expect(item).not.toHaveClass('is-disabled');

        const textEl = screen.getByText(mocks.label!);
        expect(textEl).toBeInTheDocument();
        const removeIcon = screen.getByTestId('cross-icon');
        expect(removeIcon).toBeInTheDocument();
    });

    it('should render empty when label is null', () => {
        mocks.label = null;
        const { container } = render(<SelectedFilterPill {...mocks} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render as disabled when isDisabled is true', () => {
        mocks.isDisabled = true;
        render(<SelectedFilterPill {...mocks} />);
        const item = screen.getByTestId(mocks.dataTid);
        expect(item).toHaveClass('is-disabled');
    });

    it('should call onClick when clicking on the filter item', async () => {
        render(<SelectedFilterPill {...mocks} />);

        const labelEl = screen.getByText('label');
        const item = labelEl.closest('.filter-apply__group--item');

        expect(item).toBeInTheDocument();

        await userEvent.click(item!);
        expect(mocks.onClick).toHaveBeenCalled();
    });

    it('should call onRemoveClick when clicking on the remove icon', async () => {
        render(<SelectedFilterPill {...mocks} />);

        const removeIcon = screen.getByTestId('cross-icon');
        expect(removeIcon).toBeInTheDocument();

        await userEvent.click(removeIcon!);
        expect(mocks.onRemoveClick).toHaveBeenCalled();
    });
});
