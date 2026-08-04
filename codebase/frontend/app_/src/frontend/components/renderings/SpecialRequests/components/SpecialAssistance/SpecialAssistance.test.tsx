import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { isHolidayStore } from 'frontend/store/holidays';
import { specialAssistanceFields } from 'frontend/components/renderings/SpecialRequests/__mocks__/SpecialAssistanceFields.mock';

import SpecialAssistance, { ISpecialAssistanceProps } from './SpecialAssistance';

expect.extend(toHaveNoViolations);

let mockProps: ISpecialAssistanceProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links'>{props.field.value}</div>;
    },
}));

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='sitecore-text'>{props.field.value}</div>;
    },
}));

const mockJssImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJssImage(props);

        return <div data-tid='sitecore-jss-image' />;
    },
}));

const mockPopup = jest.fn();
jest.mock(
    'frontend/components/renderings/SpecialRequests/components/SpecialAssistancePopup/SpecialAssistancePopup',
    () => ({
        __esModule: true,
        default: props => {
            mockPopup(props);

            return <div data-tid='special-assistance-popup' />;
        },
    }),
);

const mockDrawer = jest.fn();
jest.mock(
    'frontend/components/renderings/SpecialRequests/components/SpecialAssistanceDrawer/SpecialAssistanceDrawer',
    () => ({
        __esModule: true,
        default: props => {
            mockDrawer(props);

            return <div data-tid='drawer' />;
        },
    }),
);

jest.mock('frontend/store/holidays');

describe('<SpecialAssistance />', () => {
    beforeEach(() => {
        mockProps = {
            fields: specialAssistanceFields,
            isCTAEnabled: true,
        };
        mockStores = createMockStores({
            layoutStore: { isSpecialAssistanceEnabled: true, isConfirmationPage: false },
            viewBookingStore: {
                isViewBookingStatusPage: false,
            },
        });

        jest.mocked(isHolidayStore).mockReturnValue(true);
    });

    it('should NOT render if no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<SpecialAssistance {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if isSpecialAssistanceEnabled false', () => {
        mockStores.layoutStore.isSpecialAssistanceEnabled = false;
        const { container } = render(<SpecialAssistance {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render title, description and icon', () => {
        render(<SpecialAssistance {...mockProps} />);

        expect(mockText).toHaveBeenCalledWith({
            field: mockProps.fields!.InfoTitle,
            tag: 'h2',
            className: 'title',
            'data-tid': 'special-assistance-title',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields!.InfoDescription,
            tag: 'div',
            className: 'description',
            dataId: 'special-assistance-description',
        });

        expect(screen.getByTestId('sitecore-jss-image')).toBeInTheDocument();
        expect(mockJssImage).toHaveBeenCalledWith({
            field: mockProps.fields!.InfoIcon,
            dataTid: 'special-assistance-icon',
        });
    });

    it('should open popup with correct props on button click', async () => {
        render(<SpecialAssistance {...mockProps} />);
        const button = screen.getByRole('button', { name: mockProps.fields!.InfoCTA.value });

        await userEvent.click(button);

        expect(screen.getByTestId('special-assistance-popup')).toBeInTheDocument();
        expect(mockPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                onClose: expect.any(Function),
                AddAssistanceTitle: mockProps.fields!.AddAssistanceTitle,
                AddAssistanceDescription: mockProps.fields!.AddAssistanceDescription,
                AddAssistancePhone: mockProps.fields!.AddAssistancePhone,
                AddAssistanceExtra: mockProps.fields!.AddAssistanceExtra,
            }),
        );
    });

    it('should open drawer with correct props on button click on mobile', async () => {
        mockUseMobileViewport = true;
        render(<SpecialAssistance {...mockProps} />);
        const button = screen.getByRole('button', { name: mockProps.fields!.InfoCTA.value });

        await userEvent.click(button);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(mockDrawer).toHaveBeenCalledWith(
            expect.objectContaining({
                onCTAClick: expect.any(Function),
                AddAssistanceTitle: mockProps.fields!.AddAssistanceTitle,
                AddAssistanceDescription: mockProps.fields!.AddAssistanceDescription,
                AddAssistancePhone: mockProps.fields!.AddAssistancePhone,
                AddAssistanceExtra: mockProps.fields!.AddAssistanceExtra,
            }),
        );
    });

    it('should NOT render button if no text value', () => {
        mockProps.fields!.InfoCTA.value = '';
        render(<SpecialAssistance {...mockProps} />);

        expect(screen.queryByRole('button', { name: mockProps.fields!.InfoCTA.value })).not.toBeInTheDocument();
    });

    it('should NOT render button if isCTAEnabled false', () => {
        mockProps.isCTAEnabled = false;
        render(<SpecialAssistance {...mockProps} />);

        expect(screen.queryByRole('button', { name: mockProps.fields!.InfoCTA.value })).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<SpecialAssistance {...mockProps} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
