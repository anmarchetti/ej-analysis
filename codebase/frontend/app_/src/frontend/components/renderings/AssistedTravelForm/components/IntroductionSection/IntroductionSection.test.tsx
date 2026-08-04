import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { introductionSectionFieldsMock } from 'frontend/components/renderings/AssistedTravelForm/mocks/fields.mocks';
import { Screen } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import IntroductionSection, { IIntroductionSectionProps } from './IntroductionSection';

const createProps = (): IIntroductionSectionProps => ({
    fields: introductionSectionFieldsMock,
    goToScreen: jest.fn(),
    togglePopup: jest.fn(),
});

let mockProps = createProps();
let mockStores = createMockStores({
    routerStore: {
        redirectToViewBookingPage: jest.fn(),
    },
    viewBookingStore: {
        isAssistedTravelRequestsFailedToLoad: false,
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return (
            <div data-tid='rich-text-with-links'>
                <button id='contact-us-btn' onClick={props.onLinkClick} data-tid='contact-us-btn' />
            </div>
        );
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button onClick={props.onClick}>{props.children}</button>;
    },
}));

const mockContactUsClick = jest.fn();
jest.mock('frontend/components/renderings/AssistedTravelForm/utils/AssistedTravelForm.utils', () => ({
    createOnContactUsClick: () => mockContactUsClick,
}));

describe('<IntroductionSection />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            routerStore: {
                redirectToViewBookingPage: jest.fn(),
            },
        });
    });

    it('should render section header and all guests', () => {
        render(<IntroductionSection {...mockProps} />);

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: mockProps.fields.IntroductionText,
            onLinkClick: expect.any(Function),
            enableClickEventForEmptyLinks: true,
            className: 'introduction',
        });

        expect(screen.getAllByRole('button').length).toBe(3);
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: expect.any(Function),
            isText: true,
            className: 'btn',
            'aria-label': mockProps.fields.SecondaryButtonScreenReaderText?.value,
            children: mockProps.fields.SecondaryButtonLabel?.value,
            'data-tid': 'view-booking-button',
        });

        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: expect.any(Function),
            isMedium: true,
            className: 'btn',
            'aria-label': mockProps.fields.PrimaryButtonScreenReaderText?.value,
            children: mockProps.fields.PrimaryButtonLabel?.value,
            'data-tid': 'next-section-button',
        });
    });

    it('should call redirectTo with correct path when secondary button is clicked', () => {
        render(<IntroductionSection {...mockProps} />);

        const goBackButton = screen.getByRole('button', {
            name: mockProps.fields.SecondaryButtonLabel?.value,
        });
        goBackButton.click();

        expect(mockStores.routerStore.redirectToViewBookingPage).toHaveBeenCalled();
    });

    it('should call goToSection with correct section when primary button is clicked', () => {
        render(<IntroductionSection {...mockProps} />);
        const getAssistanceButton = screen.getByRole('button', {
            name: mockProps.fields.PrimaryButtonLabel?.value,
        });
        getAssistanceButton.click();

        expect(mockProps.goToScreen).toHaveBeenCalledWith(Screen.CustomerSelection);
    });

    it('should call mockContactUsClick when contact us link is clicked', async () => {
        render(<IntroductionSection {...mockProps} />);

        const link = screen.getByTestId('contact-us-btn');
        await userEvent.click(link);
        expect(mockContactUsClick).toHaveBeenCalled();
    });

    it('should disable primary button when isAssistedTravelRequestsFailedToLoad is true', () => {
        mockStores.viewBookingStore.isAssistedTravelRequestsFailedToLoad = true;

        render(<IntroductionSection {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: expect.any(Function),
            isMedium: true,
            className: 'btn',
            'aria-label': mockProps.fields.PrimaryButtonScreenReaderText?.value,
            children: mockProps.fields.PrimaryButtonLabel?.value,
            disabled: true,
            'data-tid': 'next-section-button',
        });
    });
});
