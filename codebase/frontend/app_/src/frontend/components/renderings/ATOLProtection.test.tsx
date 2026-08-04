import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ATOLProtection, { ATOLProtectionVariant } from './ATOLProtection';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('../common/JSSImage', () => ({
    __esModule: true,
    default: ({ className }) => <div className={className}>JSSImage</div>,
}));

const mockFileDownloadProps = jest.fn();
jest.mock('../common/FileDownload', () => ({
    __esModule: true,
    default: props => {
        mockFileDownloadProps(props);

        return <div className={props.className}>FileDownload</div>;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ className }) => (
        <div className={className}>
            <span>Text</span>
        </div>
    ),
}));

const resetMocks = () => ({
    onLogin: jest.fn(),
    fields: {
        Image: { value: { src: 'src' } },
        Text: { value: 'Text' },
        Title: { value: 'Title' },
    },
    params: {
        Variant: ATOLProtectionVariant.Default,
    },
    isLoggedInUserLead: true,
    bookingPdfLink: 'bookingPdfLink',
    bookingPdfRequestData: { bookingReference: 'ref', lastName: 'name', date: '2023-05-11' },
    bookingPdfFileName: 'bookingPdfFileName',
});

const resetMockStores = () =>
    createMockStores({
        layoutStore: {
            isATOLProtectionEnabled: true,
            isConfirmationPage: false,
        },
    });

let mocks;
let mockStores;

describe('<ATOLProtection />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = resetMockStores();
        mockFileDownloadProps.mockClear();
    });

    it('Should standart render with image, title, text and download button', () => {
        const { container } = render(<ATOLProtection {...mocks} />);

        expect(container.querySelectorAll('.booking-protected__info')).toHaveLength(1);
        expect(screen.queryByText('JSSImage')).toBeTruthy();
        expect(screen.getAllByText('Text')).toHaveLength(2);
        expect(screen.getAllByText('FileDownload')).toHaveLength(1);
        expect(container.querySelectorAll('.booking-protected__image')).toHaveLength(1);
        expect(container.querySelectorAll('.booking-protected__title')).toHaveLength(1);
        expect(container.querySelectorAll('.booking-protected__text')).toHaveLength(1);
        expect(container.querySelectorAll('.booking-protected__button')).toHaveLength(1);
        expect(mockFileDownloadProps).toHaveBeenCalledWith(
            expect.objectContaining({
                buttonClassName: '',
            }),
        );
    });

    it('Should forward bookingPdfRequestData to FileDownload', () => {
        render(<ATOLProtection {...mocks} />);

        expect(mockFileDownloadProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fileRequestData: mocks.bookingPdfRequestData,
            }),
        );
    });

    it('Should be empty render if no fields', () => {
        mocks.fields = undefined;
        const { container } = render(<ATOLProtection {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should be empty render when ATOL is disabled on sitecore', () => {
        mockStores.layoutStore.isATOLProtectionEnabled = false;
        const { container } = render(<ATOLProtection {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render without buttons and borders when Variant field has WithoutButtonsAndBorders value', () => {
        mocks.params.Variant = ATOLProtectionVariant.WithoutButtonsAndBorders;
        const { container } = render(<ATOLProtection {...mocks} />);

        expect(container.querySelector('.rounded-container.no-borders')).toBeInTheDocument();
        expect(container.querySelector('.booking-protected__info')).toBeInTheDocument();
        expect(screen.queryByText('JSSImage')).toBeInTheDocument();
        expect(screen.queryByText('FileDownload')).not.toBeInTheDocument();
        expect(container.querySelector('.booking-protected__image')).toBeInTheDocument();
        expect(container.querySelector('.booking-protected__title')).toBeInTheDocument();
        expect(container.querySelector('.booking-protected__button')).not.toBeInTheDocument();
    });

    it('Should NOT render download button if user is not looged in', () => {
        mocks.isLoggedInUserLead = false;
        render(<ATOLProtection {...mocks} />);

        expect(screen.queryByText('FileDownload')).not.toBeInTheDocument();
    });

    it('Should NOT render download button if it is external agency', () => {
        mocks.isExternalAgency = true;
        render(<ATOLProtection {...mocks} />);

        expect(screen.queryByText('FileDownload')).not.toBeInTheDocument();
    });

    it('Should NOT render download button if booking is cancelled', () => {
        mocks.isBookingCanceled = true;
        render(<ATOLProtection {...mocks} />);

        expect(screen.queryByText('FileDownload')).not.toBeInTheDocument();
    });

    it('Should render "login to download" button', () => {
        mocks.isLoggedInUserLead = false;
        mocks.showLoginButton = true;
        render(<ATOLProtection {...mocks} />);

        const loginBtn = screen.queryByText(SitecoreDictionary.BookingSummaryButtonsLoginToDownload);
        expect(loginBtn).toBeInTheDocument();

        fireEvent.click(loginBtn!);
        expect(mocks.onLogin).toBeCalled();
    });

    it('Should render "login to download" button with confirmation-button class on confirmation page', () => {
        mocks.isLoggedInUserLead = false;
        mocks.showLoginButton = true;
        mockStores.layoutStore.isConfirmationPage = true;
        const { container } = render(<ATOLProtection {...mocks} />);

        expect(container.querySelector('.confirmation-button')).toBeInTheDocument();
    });
});
