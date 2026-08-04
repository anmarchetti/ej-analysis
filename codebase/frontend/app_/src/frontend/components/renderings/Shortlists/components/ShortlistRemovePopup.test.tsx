import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IShortlistRemovePopupProps, ShortlistRemovePopup } from './ShortlistRemovePopup';

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, title, footerContent }) => (
        <div data-tid='popup'>
            <div data-tid='popup-title'>{title}</div>
            {children}
            <div data-tid='popup-footer-content'>{footerContent}</div>
        </div>
    ),
}));

jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: () => <div data-tid='error-message' />,
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children }) => <button onClick={onClick}>{children}</button>,
}));

describe('<ShortlistRemovePopup />', () => {
    const resetMocks = (): IShortlistRemovePopupProps => ({
        offers: [] as IOffer[],
        isShortlistRemoving: false,
        isRemoveShortlistFailed: false,
        onClose: jest.fn(),
        onRemove: jest.fn(),
        getPhrase: jest.fn(p => p),
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render title and body for one offer', () => {
        mocks.offers = [{ hotel: { name: 'test' } } as IOffer];
        render(<ShortlistRemovePopup {...mocks} />);

        expect(screen.getByTestId('popup-title')).toHaveTextContent(
            SitecoreDictionary.ShortlistRemoveHolidayPopupLabelsRemoveHolidaySingular,
        );
        expect(screen.getByText('‘test’')).toBeInTheDocument();
    });

    it('should render only title for offers lsit', () => {
        mocks.offers = [{} as IOffer, {} as IOffer];
        render(<ShortlistRemovePopup {...mocks} />);

        expect(screen.getByTestId('popup-title')).toHaveTextContent(
            SitecoreDictionary.ShortlistRemoveHolidayPopupLabelsRemoveHolidaysPlural,
        );
    });

    it('should render error message if removing is failed', () => {
        mocks.isRemoveShortlistFailed = true;
        render(<ShortlistRemovePopup {...mocks} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('should call onRemove()', async () => {
        mocks.isRemoveShortlistFailed = true;
        render(<ShortlistRemovePopup {...mocks} />);

        await userEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsRemove));

        waitFor(() => expect(mocks.onRemove).toBeCalled());
    });

    it('should call onClose()', async () => {
        mocks.isRemoveShortlistFailed = true;
        render(<ShortlistRemovePopup {...mocks} />);

        await userEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsCancel));

        waitFor(() => expect(mocks.onClose).toBeCalled());
    });
});
