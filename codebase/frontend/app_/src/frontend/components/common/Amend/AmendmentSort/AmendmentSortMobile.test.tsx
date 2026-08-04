import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendmentSortMobile from './AmendmentSortMobile';

const createProps = () => ({
    options: [
        { value: 'PRICEASC', label: 'label1' },
        { value: 'value2', label: 'label2' },
        { value: 'value3', label: 'label3' },
        { value: 'value4', label: 'label4' },
    ],
    sortBy: 'PRICEASC',
    onApplySortBy: jest.fn(),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ dataTid, isText, ...props }) => {
        mockButtonProps(props);

        return <button data-tid={dataTid} {...props} />;
    },
}));

jest.mock('frontend/components/icons/SortBy', () => () => <div data-tid='sortby' />);

jest.mock('frontend/components/icons-new/Tick', () => () => <div data-tid='tick' />);

describe('<AmendmentSortMobile />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render button', () => {
        render(<AmendmentSortMobile {...mockProps} />);

        expect(screen.getByTestId('sort-by-cta')).toBeInTheDocument();
    });

    it('should render sortby icon', () => {
        render(<AmendmentSortMobile {...mockProps} />);

        expect(screen.getByTestId('sortby')).toBeInTheDocument();
    });

    it('should render SearchResultsLabelsSortBy text', () => {
        render(<AmendmentSortMobile {...mockProps} />);

        expect(screen.getByTestId('sort-by-cta')).toHaveTextContent(SitecoreDictionary.SearchResultsLabelsSortBy);
    });

    it('should render Drawer', () => {
        render(<AmendmentSortMobile {...mockProps} />);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render heading', () => {
        render(<AmendmentSortMobile {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent(SitecoreDictionary.SearchResultsLabelsSortBy);
    });

    it('should render all labels', () => {
        render(<AmendmentSortMobile {...mockProps} />);

        expect(screen.getByTestId('amend-sort-mobile-item-priceasc')).toHaveTextContent('label1');
        expect(screen.getByTestId('amend-sort-mobile-item-value2')).toHaveTextContent('label2');
        expect(screen.getByTestId('amend-sort-mobile-item-value3')).toHaveTextContent('label3');
        expect(screen.getByTestId('amend-sort-mobile-item-value4')).toHaveTextContent('label4');
    });

    it('should render tick icon after clicking on label', async () => {
        render(<AmendmentSortMobile {...mockProps} />);

        await userEvent.click(screen.getByText('label1'));
        expect(screen.getByTestId('tick')).toBeInTheDocument();
    });

    it('should render 3 buttons after clicking open button', async () => {
        render(<AmendmentSortMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('sort-by-cta'));
        expect(screen.getAllByRole('button').length).toBe(7);
    });

    it('should render GlobalsButtonsCancel after clicking open button', async () => {
        render(<AmendmentSortMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('sort-by-cta'));
        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsCancel)).toBeInTheDocument();
    });

    it('should render SearchPodFiltersButtonsApplyAndSeeResults after clicking open button', async () => {
        render(<AmendmentSortMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('sort-by-cta'));
        expect(screen.getByText(SitecoreDictionary.SearchPodFiltersButtonsApplyAndSeeResults)).toBeInTheDocument();
    });

    it('should render 7 buttons after closing', async () => {
        render(<AmendmentSortMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('sort-by-cta'));
        await userEvent.click(screen.getAllByRole('button')[1]);
        expect(screen.getAllByRole('button').length).toBe(7);
    });

    it('should render 7 buttons after applying', async () => {
        render(<AmendmentSortMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('sort-by-cta'));
        await userEvent.click(screen.getAllByRole('button')[2]);
        expect(screen.getAllByRole('button').length).toBe(7);
    });

    it('should call onApplySortBy after applying when option is chosen', async () => {
        render(<AmendmentSortMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('sort-by-cta'));
        await userEvent.click(screen.getByText('label2'));
        await userEvent.click(screen.getAllByRole('button')[6]);
        expect(mockProps.onApplySortBy).toHaveBeenCalled();
    });

    it('should render button with disabled prop when isDisabled is true', () => {
        render(<AmendmentSortMobile {...mockProps} isDisabled />);

        expect(screen.getByTestId('sort-by-cta')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }));
    });

    it('should NOT call onApplySortBy after applying when option is NOT chosen', async () => {
        render(<AmendmentSortMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('sort-by-cta'));
        await userEvent.click(screen.getAllByRole('button')[2]);
        expect(mockProps.onApplySortBy).not.toHaveBeenCalled();
    });

    it('should NOT call onApplySortBy after applying when option is chosen and options value equals sortBy', async () => {
        render(<AmendmentSortMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('sort-by-cta'));
        await userEvent.click(screen.getByText('label1'));
        await userEvent.click(screen.getAllByRole('button')[2]);
        expect(mockProps.onApplySortBy).not.toHaveBeenCalled();
    });

    describe('test for the hotel change flow', () => {
        beforeEach(() => {
            mockProps.isHotelChangeFlow = true;
        });

        it('should render GlobalsButtonsApply text on the CTA', async () => {
            render(<AmendmentSortMobile {...mockProps} />);

            await userEvent.click(screen.getByTestId('sort-by-cta'));

            expect(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsApply })).toBeInTheDocument();
        });

        it('should apply class for the drawer', () => {
            render(<AmendmentSortMobile {...mockProps} />);

            expect(screen.getByRole('dialog')).toHaveClass('drawerChangeHotel');
        });
    });
});
