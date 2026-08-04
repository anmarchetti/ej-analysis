import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as isBackend from 'frontend/utils/isBackend';
import { scrollToElement } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FacilitiesTabs from './FacilitiesTabs';

const mockIsBackend = isBackend as { default: () => boolean };

const createProps = () => ({
    facilityGroup: {
        id: '1',
        code: 'OV',
        name: 'name',
        iconUrl: 'icon',
        items: [
            { code: 'code1', name: 'name1' },
            { code: 'code2', name: 'name2' },
            { code: 'code3', name: 'name3' },
        ],
        title: 'title',
        description: 'description',
        image: { small: 'small', medium: 'medium', large: 'large' },
    },
    rendering: [],
    isShowEcoFacilityPlaceholder: false,
    hideOnPrint: false,
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), setIsBodyScrollLocked: jest.fn() },
    appStore: { isScreenMedium: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/ui.utils', () => ({
    unLockBodyScroll: jest.fn(),
    scrollToElement: jest.fn(),
}));

jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FacilitiesTabs/FacilitiesTabsList',
    () => () => <div data-tid='facilities-tabs-list' />,
);

jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FacilitiesTabs/FacilitiesTabsPanels',
    () => () => <div data-tid='facilities-tabs-panels' />,
);

jest.mock('frontend/components/common/Drawer', () => ({ children, open }) => (
    <div data-tid='drawer' data-open={String(open)}>
        {children}
    </div>
));

describe('<FacilitiesTabs />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HotelInfoLabelsFacilitiesAndAmenities with default title', () => {
        const { getByRole } = render(<FacilitiesTabs {...mockProps} />);
        expect(screen.getByTestId('facilities-tabs')).not.toHaveClass('noPrint');

        expect(getByRole('heading')).toHaveTextContent(SitecoreDictionary.HotelInfoLabelsFacilitiesAndAmenities);
    });

    it('should render custom title', () => {
        mockProps.titleDictionaryKey = SitecoreDictionary.BookingSummaryTitlesFacilitiesTitle;
        const { getByRole } = render(<FacilitiesTabs {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent(SitecoreDictionary.BookingSummaryTitlesFacilitiesTitle);
    });

    it('should add noPrint class when hideOnPrint is true', () => {
        mockProps.hideOnPrint = true;
        render(<FacilitiesTabs {...mockProps} />);
        expect(screen.getByTestId('facilities-tabs')).toHaveClass('noPrint');
    });

    it('should render FacilitiesTabsList', () => {
        const { getByTestId } = render(<FacilitiesTabs {...mockProps} />);

        expect(getByTestId('facilities-tabs-list')).toBeInTheDocument();
    });

    it('should render drawer when screen NOT medium and is no backend', () => {
        mockIsBackend.default = () => false;
        const { getByTestId } = render(<FacilitiesTabs {...mockProps} />);

        expect(getByTestId('drawer')).toBeInTheDocument();
    });

    it('should render drawer after mount when screen NOT medium even when isBackend returns true', () => {
        mockIsBackend.default = () => true;

        const { getByTestId } = render(<FacilitiesTabs {...mockProps} />);

        expect(getByTestId('drawer')).toBeInTheDocument();
    });

    it('should NOT render drawer when screen is medium and is NO backend', () => {
        mockIsBackend.default = () => false;
        mockStores.appStore.isScreenMedium = true;
        const { queryByTestId } = render(<FacilitiesTabs {...mockProps} />);

        expect(queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('should render drawer closed on initial render on mobile', () => {
        mockIsBackend.default = () => false;
        mockStores.appStore.isScreenMedium = false;
        const { getByTestId } = render(<FacilitiesTabs {...mockProps} />);

        expect(getByTestId('drawer')).toHaveAttribute('data-open', 'false');
    });

    it('should render drawer open on initial render on desktop', () => {
        mockIsBackend.default = () => false;
        mockStores.appStore.isScreenMedium = true;
        const { queryByTestId } = render(<FacilitiesTabs {...mockProps} />);

        expect(queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('should render FacilitiesTabsPanels', () => {
        const { getByTestId } = render(<FacilitiesTabs {...mockProps} />);

        expect(getByTestId('facilities-tabs-panels')).toBeInTheDocument();
    });

    it('should render button in drawer', () => {
        mockIsBackend.default = () => false;
        const { getByTestId, getByRole } = render(<FacilitiesTabs {...mockProps} />);

        const button = getByRole('button');
        expect(getByTestId('drawer')).toContainElement(button);
        expect(button).toHaveTextContent(SitecoreDictionary.GlobalsButtonsBack);
    });

    it('should scrollToElement when drawer is closed', async () => {
        mockIsBackend.default = () => false;
        const { container } = render(<FacilitiesTabs {...mockProps} />);
        const button = screen.getByRole('button');

        await userEvent.click(button);
        await waitFor(() => expect(scrollToElement).toBeCalledWith(container.firstChild, 20));
    });

    it('should NOT render title when shouldShowTitle is false', () => {
        mockProps.shouldShowTitle = false;
        const { queryByRole } = render(<FacilitiesTabs {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should scrollToElement with stickyBar offset when sticky bar exists', async () => {
        mockIsBackend.default = () => false;

        const stickyBar = document.createElement('div');
        stickyBar.className = 'search-bar-wr__sticky-box';
        Object.defineProperty(stickyBar, 'offsetHeight', { value: 60 });
        document.body.appendChild(stickyBar);

        const { container } = render(<FacilitiesTabs {...mockProps} />);
        const button = screen.getByRole('button');

        await userEvent.click(button);
        await waitFor(() => expect(scrollToElement).toBeCalledWith(container.firstChild, 80));

        document.body.removeChild(stickyBar);
    });

    it('should NOT call scrollToElement when component is unmounted before timeout', () => {
        jest.useFakeTimers();
        mockIsBackend.default = () => false;

        const { unmount } = render(<FacilitiesTabs {...mockProps} />);
        const button = screen.getByRole('button');

        fireEvent.click(button);
        unmount();

        jest.runAllTimers();
        expect(scrollToElement).not.toHaveBeenCalled();

        jest.useRealTimers();
    });
});
