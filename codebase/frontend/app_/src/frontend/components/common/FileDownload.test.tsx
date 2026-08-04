import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { FileType } from 'models/enum/FileType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FileDownload, { IFileDownloadProps } from './FileDownload';

jest.mock('axios');

(axios as any).mockImplementation(() => Promise.resolve({ data: 'data' }));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, className, ...props }) => {
        mockButtonProps(props);

        return (
            <button className={className} onClick={onClick} onKeyDown={jest.fn()}>
                {children}
            </button>
        );
    },
}));

jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: ({ children, footerContent }) => (
        <div data-tid='popup'>
            {children}
            {footerContent}
        </div>
    ),
}));

jest.mock('frontend/components/icons-new/Checklist', () => ({
    __esModule: true,
    default: () => <svg data-tid='checklist-icon' />,
}));

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('FileDownload', () => {
    const resetMocks = (): IFileDownloadProps => ({
        fileName: 'fileName',
        fileType: FileType.Pdf,
        fileURL: 'fileURL',
        buttonClassName: 'buttonClassName',
        ariaLabel: 'ariaLabel',
        buttonDataTid: 'test-tid',
        children: <div data-tid='test-children' />,
        onClick: jest.fn(),
    });

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({
            layoutStore: { isFullMaintenance: false },
        });
    });

    it('should render button and NOT render popup when isFailPopupShown is false', () => {
        render(<FileDownload {...mocks} />);

        expect(screen.getByRole('button')).toHaveClass('buttonClassName');
        expect(screen.getByTestId('test-children')).toBeInTheDocument();
        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            isLoading: false,
            'data-tid': 'test-tid',
            'aria-label': 'ariaLabel',
        });
    });

    it('should call api and success download file', async () => {
        render(<FileDownload {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        expect(axios).toHaveBeenCalledWith({
            method: 'get',
            url: 'fileURL',
            responseType: 'blob',
            headers: { Accept: mocks.fileType },
        });
        expect(mocks.onClick).toHaveBeenCalled();
    });

    it('should POST with body when fileRequestData is provided', async () => {
        mocks.fileRequestData = { bookingReference: 'REF', lastName: 'Smith', date: '2023-05-11' };

        render(<FileDownload {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        expect(axios).toHaveBeenCalledWith({
            method: 'post',
            url: 'fileURL',
            data: { bookingReference: 'REF', lastName: 'Smith', date: '2023-05-11' },
            responseType: 'blob',
            headers: { Accept: mocks.fileType },
        });
        expect(mocks.onClick).toHaveBeenCalled();
    });

    it('should request a new file when fileRequestData changes', async () => {
        mocks.fileRequestData = { bookingReference: 'REF-1', lastName: 'Smith', date: '2023-05-11' };
        const { rerender } = render(<FileDownload {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        mocks.fileRequestData = { bookingReference: 'REF-2', lastName: 'Jones', date: '2023-06-12' };

        rerender(<FileDownload {...mocks} />);

        await userEvent.click(screen.getAllByRole('button')[0]);

        expect(axios).toHaveBeenCalledTimes(2);
        expect(axios).toHaveBeenLastCalledWith({
            method: 'post',
            url: 'fileURL',
            data: { bookingReference: 'REF-2', lastName: 'Jones', date: '2023-06-12' },
            responseType: 'blob',
            headers: { Accept: mocks.fileType },
        });
    });

    it('should call navigator.msSaveOrOpenBlob when navigator.msSaveOrOpenBlob is provided', async () => {
        const mockNavigatorMsSave = jest.fn();
        Object.assign(navigator, {
            msSaveOrOpenBlob: mockNavigatorMsSave,
        });

        render(<FileDownload {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        expect(axios).toHaveBeenCalledWith({
            method: 'get',
            url: 'fileURL',
            responseType: 'blob',
            headers: { Accept: mocks.fileType },
        });
        expect(mocks.onClick).toHaveBeenCalled();
        expect(mockNavigatorMsSave).toHaveBeenCalled();
    });

    it('should render popup with title and footerContent when download fails', async () => {
        const { rerender } = render(<FileDownload {...mocks} />);

        (axios as any).mockImplementationOnce(() => Promise.reject());

        await userEvent.click(screen.getByRole('button'));

        rerender(<FileDownload {...mocks} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(2);
        expect(screen.getByText(SitecoreDictionary.BookingDocumentsPopupLabelsGeneratingReport)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsClose)).toBeInTheDocument();
    });

    it('should render checklist icon in popup when download fails', async () => {
        const { rerender } = render(<FileDownload {...mocks} />);

        (axios as any).mockImplementationOnce(() => Promise.reject());

        await userEvent.click(screen.getByRole('button'));

        rerender(<FileDownload {...mocks} />);

        expect(screen.getByTestId('checklist-icon')).toBeInTheDocument();
    });

    it('should render custom errorMessage in popup when provided', async () => {
        mocks.errorMessage = 'Custom error message';
        const { rerender } = render(<FileDownload {...mocks} />);

        (axios as any).mockImplementationOnce(() => Promise.reject());

        await userEvent.click(screen.getByRole('button'));

        rerender(<FileDownload {...mocks} />);

        expect(screen.getByText('Custom error message')).toBeInTheDocument();
        expect(
            screen.queryByText(SitecoreDictionary.BookingDocumentsPopupLabelsGeneratingReport),
        ).not.toBeInTheDocument();
    });

    it('should close popup on cancel button click', async () => {
        const { rerender } = render(<FileDownload {...mocks} />);

        (axios as any).mockImplementationOnce(() => Promise.reject());

        await userEvent.click(screen.getByRole('button'));

        rerender(<FileDownload {...mocks} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();

        await userEvent.click(screen.getAllByRole('button')[1]);

        rerender(<FileDownload {...mocks} />);

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
    });

    describe('showLoginPopup', () => {
        it('should call setIsRedirectPreventedAfterLogin and toggleLoginPopup instead of downloading when showLoginPopup is true', async () => {
            mocks.showLoginPopup = true;

            render(<FileDownload {...mocks} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockStores.userStore.setIsRedirectPreventedAfterLogin).toHaveBeenCalledWith(true);
            expect(mockStores.userStore.toggleLoginPopup).toHaveBeenCalled();
            expect(axios).not.toHaveBeenCalled();
            expect(mocks.onClick).not.toHaveBeenCalled();
        });

        it('should proceed with file download when showLoginPopup is false', async () => {
            mocks.showLoginPopup = false;

            render(<FileDownload {...mocks} />);

            await userEvent.click(screen.getByRole('button'));

            expect(axios).toHaveBeenCalled();
            expect(mockStores.userStore.toggleLoginPopup).not.toHaveBeenCalled();
        });
    });
});
