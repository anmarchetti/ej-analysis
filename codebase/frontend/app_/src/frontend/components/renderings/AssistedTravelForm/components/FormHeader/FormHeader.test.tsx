import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { buildFlightPlusHotelUrl } from 'frontend/utils/url.utils';
import { formHeaderFieldsMock } from 'frontend/components/renderings/AssistedTravelForm/mocks/fields.mocks';
import { PopupType, Screen } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import FormHeader, { TFormHeaderProps } from './FormHeader';

jest.mock('frontend/utils/url.utils', () => ({
    ...jest.requireActual('frontend/utils/url.utils'),
    buildFlightPlusHotelUrl: jest.fn(),
}));
const mockedBuildFlightPlusHotelUrl = buildFlightPlusHotelUrl as jest.MockedFn<typeof buildFlightPlusHotelUrl>;

const createStores = (isFlightPlusHotelFunnel = false) =>
    createMockStores({
        layoutStore: {
            getBreadcrumb: jest.fn(() => ({ key: 'test 1', value: 'Test 1' })),
            pageBreadcrumbs: [{ key: 'test 2', value: 'Test 2' }],
        },
        queryParamStore: {
            isFlightPlusHotelFunnel,
        },
    });

const createProps = (): TFormHeaderProps => ({
    fields: formHeaderFieldsMock,
    currentScreen: Screen.Introduction,
    togglePopup: jest.fn(),
    currentStepInProgressBar: 0,
    currentSectionTitle: 'Test Section',
    totalProgressBarSteps: 3,
});
let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPageHeaderProps = jest.fn();
jest.mock('frontend/components/common/PageHeader/PageHeader', () => ({
    __esModule: true,
    default: props => {
        mockPageHeaderProps(props);

        return <div data-tid='page-header'>{props.children}</div>;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return (
            <div data-tid='rich-text-with-links'>
                <button id='contact-us-btn' data-tid='contact-us-btn' onClick={props.onLinkClick} />
            </div>
        );
    },
}));

const mockContactUsClick = jest.fn();
jest.mock('frontend/components/renderings/AssistedTravelForm/utils/AssistedTravelForm.utils', () => ({
    createOnContactUsClick: () => mockContactUsClick,
}));

describe('<FormHeader />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render subtitle for Introduction section', () => {
        render(<FormHeader {...mockProps} />);

        expect(screen.getByTestId('page-header')).toBeInTheDocument();
        expect(mockPageHeaderProps).toHaveBeenCalledWith({
            Title: mockProps.fields.HeaderTitle,
            breadcrumbs: [
                { key: 'test 1', value: 'Test 1' },
                { key: 'test 2', value: 'Test 2' },
            ],
            onBreadcrumbClick: expect.any(Function),
            children: expect.anything(),
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: mockProps.fields.HeaderSubtitle,
            className: 'subtitle',
            onLinkClick: expect.any(Function),
            enableClickEventForEmptyLinks: true,
        });
    });

    it('should has empty breadcrumbs if pageBreadcrumbs is empty', () => {
        mockStores.layoutStore.pageBreadcrumbs = [];
        render(<FormHeader {...mockProps} />);

        expect(mockPageHeaderProps).toHaveBeenCalledWith({
            Title: mockProps.fields.HeaderTitle,
            breadcrumbs: [
                { key: 'test 1', value: 'Test 1' },
                { key: '', value: '' },
            ],
            onBreadcrumbClick: expect.any(Function),
            children: expect.anything(),
        });
    });

    it('should render subtitle for Customer Selection section', () => {
        mockProps.currentScreen = Screen.CustomerSelection;
        render(<FormHeader {...mockProps} />);

        expect(screen.getByTestId('page-header')).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
    });

    it('should render customer name for Dynamic section', () => {
        mockProps = {
            ...mockProps,
            customerFullName: 'John D. Doe',
            isAdult: true,
            currentScreen: Screen.DynamicSection,
        };

        render(<FormHeader {...mockProps} />);

        expect(screen.getByTestId('page-header')).toBeInTheDocument();
        expect(screen.getByTestId('customer-name')).toBeInTheDocument();
        expect(screen.getByText('John D. Doe')).toBeInTheDocument();
        expect(screen.getByTestId('user-circle-icon')).toBeInTheDocument();
    });

    it('should render child icon when customer is NOT adult', () => {
        mockProps = {
            ...mockProps,
            customerFullName: 'Jane D. Doe',
            isAdult: false,
            currentScreen: Screen.DynamicSection,
        };

        render(<FormHeader {...mockProps} />);

        expect(screen.getByTestId('customer-name')).toBeInTheDocument();
        expect(screen.getByTestId('child-circle-icon')).toBeInTheDocument();
    });

    it('should NOT render customer name if no customer is selected in Dynamic section', () => {
        mockProps.currentScreen = Screen.DynamicSection;
        mockProps.customerFullName = '';

        render(<FormHeader {...mockProps} />);

        expect(screen.getByTestId('page-header')).toBeInTheDocument();
        expect(screen.queryByTestId('customer-name')).not.toBeInTheDocument();
    });

    it('should render progress indicator with correct section info', () => {
        mockProps.currentScreen = Screen.DynamicSection;
        mockProps.customerFullName = 'John D. Doe';
        mockProps.currentStepInProgressBar = 1;
        mockProps.currentSectionTitle = 'Test Selection';
        mockProps.totalProgressBarSteps = 3;

        render(<FormHeader {...mockProps} />);
        expect(screen.getByText('- Test Selection')).toBeInTheDocument();
        expect(screen.getByText('ProgressIndicator')).toBeInTheDocument();
    });

    it('should NOT render children if currentSection is not Introduction, Customer Selection or Support Needs', () => {
        mockProps.currentScreen = 'Other' as Screen;
        render(<FormHeader {...mockProps} />);

        expect(screen.getByTestId('page-header')).toBeEmptyDOMElement();
    });

    it('should take default values for optional props', () => {
        mockProps.currentScreen = Screen.DynamicSection;
        render(<FormHeader {...mockProps} currentStepInProgressBar={undefined} totalProgressBarSteps={undefined} />);

        expect(screen.queryByTestId('progress-indicator')).not.toBeInTheDocument();
    });

    it('should call mockContactUsClick when contact us link is clicked', async () => {
        render(<FormHeader {...mockProps} />);

        const link = screen.getByTestId('contact-us-btn');

        await userEvent.click(link);
        expect(mockContactUsClick).toHaveBeenCalled();
    });

    it('should call togglePopup with BackButtonWarning when onBreadcrumbClick is triggered', () => {
        render(<FormHeader {...mockProps} />);

        const onBreadcrumbClick = mockPageHeaderProps.mock.calls[0][0].onBreadcrumbClick;
        const mockEvent = { preventDefault: jest.fn() } as unknown as React.MouseEvent<HTMLAnchorElement>;

        onBreadcrumbClick(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockProps.togglePopup).toHaveBeenCalledWith(PopupType.BackButtonWarning);
    });

    describe('breadcrumbs with flight plus hotel funnel', () => {
        it('should use buildFlightPlusHotelUrl for view booking breadcrumb when isFlightPlusHotelFunnel is true', () => {
            mockStores = createStores(true);
            mockedBuildFlightPlusHotelUrl.mockReturnValue('Test 1?ecp=fph');

            render(<FormHeader {...mockProps} />);

            expect(mockedBuildFlightPlusHotelUrl).toHaveBeenCalledWith('Test 1');
            expect(mockPageHeaderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    breadcrumbs: [
                        { key: 'test 1', value: 'Test 1?ecp=fph' },
                        { key: 'test 2', value: 'Test 2' },
                    ],
                }),
            );
        });

        it('should use regular view booking breadcrumb url when isFlightPlusHotelFunnel is false', () => {
            mockStores = createStores(false);

            render(<FormHeader {...mockProps} />);

            expect(mockedBuildFlightPlusHotelUrl).not.toHaveBeenCalled();
            expect(mockPageHeaderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    breadcrumbs: [
                        { key: 'test 1', value: 'Test 1' },
                        { key: 'test 2', value: 'Test 2' },
                    ],
                }),
            );
        });
    });
});
