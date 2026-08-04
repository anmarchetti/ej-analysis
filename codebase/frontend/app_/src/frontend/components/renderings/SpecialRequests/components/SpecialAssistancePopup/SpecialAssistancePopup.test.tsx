import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { specialAssistanceFields } from 'frontend/components/renderings/SpecialRequests/__mocks__/SpecialAssistanceFields.mock';

import SpecialAssistancePopup, { ISpecialAssistancePopupProps } from './SpecialAssistancePopup';

expect.extend(toHaveNoViolations);

const createProps = () => ({
    onClose: jest.fn(),
    ...specialAssistanceFields,
});

let mockProps: ISpecialAssistancePopupProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPopup = jest.fn();

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, footerContent, ...props }) => {
        mockPopup(props);

        return (
            <div data-tid='popup'>
                {children}
                {footerContent}
            </div>
        );
    },
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

        return <div data-tid='sitecore-text' />;
    },
}));

describe('<SpecialAssistancePopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render popup with correct props', () => {
        render(<SpecialAssistancePopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopup).toHaveBeenCalledWith({
            onClose: mockProps.onClose,
            contentClass: 'popupContent',
            id: 'special-assistance-popup',
        });
    });

    it('should render title, description, phone and extra text', () => {
        render(<SpecialAssistancePopup {...mockProps} />);

        expect(mockText).toHaveBeenCalledWith({
            field: mockProps.AddAssistanceTitle,
            tag: 'h3',
            className: 'title',
            'data-tid': 'special-assistance-popup-title',
        });

        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.AddAssistanceDescription,
            tag: 'p',
            className: 'text',
            dataId: 'special-assistance-popup-description',
        });

        expect(mockText).toHaveBeenCalledWith({
            field: mockProps.AddAssistancePhone,
            tag: 'div',
            className: 'phone',
            'data-tid': 'special-assistance-popup-phone',
        });

        expect(screen.getAllByTestId('rich-text-with-links')).toHaveLength(2);
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.AddAssistanceExtra,
            tag: 'p',
            className: 'text',
            dataId: 'special-assistance-popup-extra',
        });
    });

    it('should call onClose func on button click', async () => {
        render(<SpecialAssistancePopup {...mockProps} />);

        const button = screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsClose });
        expect(button).toBeInTheDocument();

        await userEvent.click(button);

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<SpecialAssistancePopup {...mockProps} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
