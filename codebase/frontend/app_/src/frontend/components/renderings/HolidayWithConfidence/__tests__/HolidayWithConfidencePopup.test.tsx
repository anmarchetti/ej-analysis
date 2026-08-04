import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import HolidayWithConfidencePopup from 'frontend/components/renderings/HolidayWithConfidence/components/HolidayWithConfidencePopup';

const createProps = () => ({
    isScreenMedium: false,
    togglePopup: jest.fn(),
    isShowPopup: true,
    fields: {
        PopupTitle: { value: 'PopupTitle' },
        PopupSubtitle: { value: 'PopupSubtitle' },
        PopupEndText: { value: 'PopupEndText' },
        PopupLink: { value: { href: 'href', text: 'link' } },
        PopupList: [
            { id: 1, fields: {} },
            { id: 2, fields: {} },
        ],
    },
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    appStore: { isScreenMedium: false },
    routerStore: {},
    queryParamStore: {},
    userStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

jest.mock('frontend/components/common/Drawer', () => ({ children }) => <div data-tid='drawer'>{children}</div>);

jest.mock('frontend/components/renderings/HolidayWithConfidence/components/ConfidencePopupListItem', () => () => (
    <div data-tid='item' />
));

describe('<HolidayWithConfidencePopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    describe('Overlay', () => {
        it('should NOT render if screen is medium and popup NOT shown', () => {
            mockStores.appStore.isScreenMedium = true;
            mockProps.isShowPopup = false;
            const { container } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should render popup if screen is medium', () => {
            mockStores.appStore.isScreenMedium = true;
            const { getByTestId } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(getByTestId('popup')).toBeInTheDocument();
        });

        it('should render drawer if screen is NOT medium', () => {
            const { getByTestId } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(getByTestId('drawer')).toBeInTheDocument();
        });
    });

    describe('popupContent', () => {
        it('should render PopupTitle', () => {
            const { getByText } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(getByText('PopupTitle')).toBeInTheDocument();
        });

        it('should render PopupSubtitle', () => {
            const { getByText } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(getByText('PopupSubtitle')).toBeInTheDocument();
        });

        it('should render 2 ConfidencePopupListItem', () => {
            const { getAllByTestId } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(getAllByTestId('item').length).toBe(2);
        });

        it('should NOT render ConfidencePopupListItem when no item', () => {
            mockProps.fields.PopupList = [];
            const { queryByTestId } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(queryByTestId('item')).not.toBeInTheDocument();
        });

        it('should render PopupEndText', () => {
            const { getByText } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(getByText('PopupEndText')).toBeInTheDocument();
        });

        it('should render link', () => {
            const { getByRole } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(getByRole('link')).toHaveTextContent('link');
        });

        it('should NOT render link when no field', () => {
            mockProps.fields.PopupLink.value.href = null;
            const { queryByRole } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(queryByRole('link')).not.toBeInTheDocument();
        });
    });

    describe('footerContent', () => {
        it('should render button in footer', () => {
            const { getByRole } = render(<HolidayWithConfidencePopup {...mockProps} />);

            expect(getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsClose);
        });

        it('should call togglePopup when clicking on button', () => {
            const { getByRole } = render(<HolidayWithConfidencePopup {...mockProps} />);

            const button = getByRole('button');
            fireEvent.click(button);
            expect(mockProps.togglePopup).toHaveBeenCalled();
        });
    });
});
