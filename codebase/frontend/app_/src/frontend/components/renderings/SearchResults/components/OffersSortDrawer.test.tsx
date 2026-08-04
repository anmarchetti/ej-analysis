import React from 'react';
import { render, screen, within } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { OffersSortDrawer } from './OffersSortDrawer';

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: () => <div data-tid='tooltip-trigger' />,
    TooltipContent: ({ text }: { text: string }) => <div data-tid='tooltip-content'>{text}</div>,
}));

jest.mock('frontend/components/icons-new/Tick', () => () => <svg data-tid='svg-tick' />);

jest.mock('frontend/components/common/Drawer', () =>
    jest.fn(({ open, children, 'data-tid': dataTid }) =>
        open ? <div data-tid={dataTid || 'mocked-drawer'}>{children}</div> : null,
    ),
);

const createStores = () => ({
    layoutStore: {
        isBodyScrollLocked: false,
    },
});

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OffersSortDrawer />', () => {
    const resetMocks = () => ({
        onCancel: jest.fn(),
        onCloseDrawer: jest.fn(),
        isOpen: true,
        sortOptions: [
            {
                value: 'RM',
                label: 'Rec',
            },
            {
                value: 'HG',
                label: 'High',
            },
        ],
        selectedOrderCode: 'RM',
        getPhrase: jest.fn(key => {
            if (key === SitecoreDictionary.SearchResultsLabelsSortBy) return 'Test Sort By Title';

            if (key === SitecoreDictionary.SearchResultsLabelsInformationAboutSort) return 'Test Tooltip Info';

            return key;
        }),
        setSeachPerformWithNewParams: jest.fn(),
    });

    let props = resetMocks();

    beforeEach(() => {
        props = resetMocks();
        mockStores = createStores();
    });

    describe('Base render', () => {
        it('Should not render drawer content if Drawer component handles open=false by not rendering children', () => {
            render(<OffersSortDrawer {...props} isOpen={false} />);

            expect(screen.queryByTestId('drawer-content')).not.toBeInTheDocument();
            expect(screen.queryByTestId('mocked-drawer')).not.toBeInTheDocument();
        });

        it('Should render drawer content when open', () => {
            render(<OffersSortDrawer {...props} isOpen={true} />);
            expect(screen.getByTestId('mocked-drawer')).toBeInTheDocument();
            expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
        });
    });

    it('should render the main layout structure inside the drawer', () => {
        render(<OffersSortDrawer {...props} />);

        expect(screen.getByTestId('mocked-drawer')).toBeInTheDocument();

        const drawerContent = screen.getByTestId('drawer-content');
        expect(drawerContent).toBeInTheDocument();

        expect(screen.getByTestId('drawer-content-title')).toBeInTheDocument();
        expect(screen.getByTestId('drawer-content-list')).toBeInTheDocument();
        // check if we have 2 buttons without naming calsses just role
        expect(screen.getAllByRole('button').length).toBe(2);
    });

    it('should render the title section correctly', () => {
        props.isOpen = true;

        render(<OffersSortDrawer {...props} />);

        const titleSection = screen.getByTestId('drawer-content-title');
        expect(within(titleSection).getByRole('heading', { level: 4, name: 'Test Sort By Title' })).toBeInTheDocument();
        expect(within(titleSection).getByTestId('tooltip')).toBeInTheDocument();
        expect(within(titleSection).getByTestId('tooltip-trigger')).toBeInTheDocument();

        const tooltipContent = within(titleSection).getByTestId('tooltip-content');
        expect(tooltipContent).toBeInTheDocument();
        expect(tooltipContent).toHaveTextContent('Test Tooltip Info');
    });

    it('should render the list of sort options correctly', () => {
        render(<OffersSortDrawer {...props} />);

        const list = screen.getByTestId('drawer-content-list');
        expect(list).toBeInTheDocument();

        const options = within(list).getAllByRole('listitem');
        expect(options).toHaveLength(props.sortOptions.length);

        props.sortOptions.forEach(optionData => {
            const optionElement = screen.getByTestId(`sort-option-${optionData.value}`);
            expect(optionElement).toHaveTextContent(optionData.label);

            if (optionData.value === props.selectedOrderCode) {
                expect(optionElement).toHaveClass('active');
            } else {
                expect(optionElement).not.toHaveClass('active');
            }
        });
    });

    it('should display the active icon for the currently selected sort option', () => {
        props.isOpen = true;
        props.selectedOrderCode = 'HG';

        render(<OffersSortDrawer {...props} />);

        const activeOptionHg = screen.getByTestId('sort-option-HG');
        expect(within(activeOptionHg).getByTestId('active-icon')).toBeInTheDocument();
        expect(within(activeOptionHg).getByTestId('svg-tick')).toBeInTheDocument();

        const inactiveOptionRm = screen.getByTestId('sort-option-RM');
        expect(within(inactiveOptionRm).queryByTestId('active-icon-RM')).not.toBeInTheDocument();
    });

    it('should render action buttons with correct text', () => {
        render(<OffersSortDrawer {...props} />);

        expect(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsCancel })).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: SitecoreDictionary.SearchPodFiltersButtonsApplyAndSeeResults }),
        ).toBeInTheDocument();
    });
});
