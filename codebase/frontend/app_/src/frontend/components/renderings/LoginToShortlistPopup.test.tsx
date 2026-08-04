import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ILoginToShortlistPopupProps, LoginToShortlistPopup } from './LoginToShortlistPopup';

const mockLoginPopupProps = jest.fn();
jest.mock('frontend/components/common/LoginPopup/LoginPopup', () => props => {
    mockLoginPopupProps(props);

    return (
        <div data-tid='login-popup'>
            <button onClick={props.afterLoginAction}>call after login action</button>
            <button onClick={props.onClose}>close</button>
        </div>
    );
});

const createProps = (): ILoginToShortlistPopupProps => ({
    customerLogin: {} as any,
    isFullMaintenance: false,
    isRedirectToShortlistPage: false,
    isShowLoginPopup: true,
    redirectToShortlistNoResultsPage: jest.fn(),
    redirectToShortlistPage: jest.fn(),
    savedOffersCount: 0,
    setIsRedirectPreventedAfterLogin: jest.fn(),
    setRedirectToShortlistPage: jest.fn(),
    toggleShowLoginPopup: jest.fn(),
    updateCandidateInShortlist: jest.fn(),
    getPhrase: jest.fn(p => p),
});

let mockProps;

describe('<LoginPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should not render component on isFullMaintenance', () => {
        mockProps.isFullMaintenance = true;
        const { container } = render(<LoginToShortlistPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render component when isShowLoginPopup is false', () => {
        mockProps.isShowLoginPopup = false;
        const { container } = render(<LoginToShortlistPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should call LoginPopup with redirect title and description', () => {
        mockProps.isRedirectToShortlistPage = true;
        render(<LoginToShortlistPopup {...mockProps} />);

        expect(mockLoginPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: SitecoreDictionary.ShortlistLoginPopupRedirectTitle,
                description: SitecoreDictionary.ShortlistLoginPopupRedirectDescription,
            }),
        );
    });

    it('Should call LoginPopup with login title and description', () => {
        render(<LoginToShortlistPopup {...mockProps} />);

        expect(mockLoginPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: SitecoreDictionary.ShortlistLoginPopupTitle,
                description: SitecoreDictionary.ShortlistLoginPopupDescription,
            }),
        );
    });

    describe('afterLoginAction', () => {
        it('when redirect to shortlist page with login errors', async () => {
            mockProps.isRedirectToShortlistPage = true;
            mockProps.customerLogin.errors = [{}];
            render(<LoginToShortlistPopup {...mockProps} />);

            await userEvent.click(screen.getByText('call after login action'));

            expect(mockProps.toggleShowLoginPopup).not.toHaveBeenCalled();
            expect(mockProps.redirectToShortlistPage).not.toHaveBeenCalled();
            expect(mockProps.redirectToShortlistNoResultsPage).not.toHaveBeenCalled();
            expect(mockProps.updateCandidateInShortlist).not.toHaveBeenCalled();
        });

        it('when redirect to shortlist page without login errors and user has shortlisted offers', async () => {
            mockProps.isRedirectToShortlistPage = true;
            mockProps.customerLogin.errors = [];
            mockProps.savedOffersCount = 1;
            render(<LoginToShortlistPopup {...mockProps} />);

            await userEvent.click(screen.getByText('call after login action'));

            expect(mockProps.toggleShowLoginPopup).toHaveBeenCalledWith(false);
            expect(mockProps.redirectToShortlistPage).toHaveBeenCalled();
            expect(mockProps.setRedirectToShortlistPage).toHaveBeenCalled();
        });

        it('when redirect to shortlist page without login errors and shortlisted offers are not loaded yet', async () => {
            mockProps.isRedirectToShortlistPage = true;
            mockProps.customerLogin.errors = [];
            mockProps.savedOffersCount = null;
            render(<LoginToShortlistPopup {...mockProps} />);

            await userEvent.click(screen.getByText('call after login action'));

            expect(mockProps.toggleShowLoginPopup).toHaveBeenCalledWith(false);
            expect(mockProps.redirectToShortlistPage).toHaveBeenCalled();
            expect(mockProps.setRedirectToShortlistPage).toHaveBeenCalled();
        });

        it('when redirect to shortlist page without login errors and user has no shortlisted offers', async () => {
            mockProps.isRedirectToShortlistPage = true;
            mockProps.customerLogin.errors = [];
            render(<LoginToShortlistPopup {...mockProps} />);

            await userEvent.click(screen.getByText('call after login action'));

            expect(mockProps.toggleShowLoginPopup).toHaveBeenCalledWith(false);
            expect(mockProps.redirectToShortlistNoResultsPage).toHaveBeenCalled();
            expect(mockProps.setRedirectToShortlistPage).toHaveBeenCalled();
        });

        it('when redirect to login page', async () => {
            render(<LoginToShortlistPopup {...mockProps} />);

            await userEvent.click(screen.getByText('call after login action'));

            expect(mockProps.toggleShowLoginPopup).toHaveBeenCalledWith(false);
            expect(mockProps.updateCandidateInShortlist).toHaveBeenCalled();
        });
    });

    describe('close popup', () => {
        it('should call toggleShowLoginPopup and no redirect on shortlist page when isRedirectToShortlistPage is false', async () => {
            render(<LoginToShortlistPopup {...mockProps} />);

            await userEvent.click(screen.getByText('close'));

            expect(mockProps.toggleShowLoginPopup).toHaveBeenCalledWith(false);
            expect(mockProps.setRedirectToShortlistPage).not.toHaveBeenCalled();
        });

        it('should call toggleShowLoginPopup and redirect on shortlist page when isRedirectToShortlistPage is true', async () => {
            mockProps.isRedirectToShortlistPage = true;
            render(<LoginToShortlistPopup {...mockProps} />);

            await userEvent.click(screen.getByText('close'));

            expect(mockProps.toggleShowLoginPopup).toHaveBeenCalledWith(false);
            expect(mockProps.setRedirectToShortlistPage).toHaveBeenCalledWith(false);
        });
    });
});
