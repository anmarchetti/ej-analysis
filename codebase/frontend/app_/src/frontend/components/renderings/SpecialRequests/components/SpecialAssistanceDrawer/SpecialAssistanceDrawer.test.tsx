import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { specialAssistanceFields } from 'frontend/components/renderings/SpecialRequests/__mocks__/SpecialAssistanceFields.mock';

import SpecialAssistanceDrawer, { ISpecialAssistanceDrawerProps } from './SpecialAssistanceDrawer';

expect.extend(toHaveNoViolations);

const createProps = () => ({
    onCTAClick: jest.fn(),
    ...specialAssistanceFields,
});

let mockProps: ISpecialAssistanceDrawerProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockWarningPopupProps = jest.fn();
jest.mock('frontend/components/renderings/WarningPopup/WarningPopup', () => ({
    __esModule: true,
    default: ({ extraContent, ...props }) => {
        mockWarningPopupProps(props);

        return <div data-tid='warning-popup'>{extraContent}</div>;
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

describe('<SpecialAssistanceDrawer />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render and pass correct props to warning popup', () => {
        render(<SpecialAssistanceDrawer {...mockProps} />);

        expect(screen.getByTestId('warning-popup')).toBeInTheDocument();

        expect(mockWarningPopupProps).toHaveBeenCalledWith({
            title: mockProps.AddAssistanceTitle,
            description: mockProps.AddAssistanceDescription,
            secondaryCtaText: { value: SitecoreDictionary.GlobalsButtonsClose },
            onSecondaryCtaClick: mockProps.onCTAClick,
            onClose: mockProps.onCTAClick,
        });
    });

    it('should render phone and extra text', () => {
        render(<SpecialAssistanceDrawer {...mockProps} />);

        expect(mockText).toHaveBeenCalledWith({
            field: mockProps.AddAssistancePhone,
            tag: 'div',
            className: 'phone',
            'data-tid': 'warning-popup-phone',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.AddAssistanceExtra,
            tag: 'p',
            className: 'text',
            dataId: 'warning-popup-extra',
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<SpecialAssistanceDrawer {...mockProps} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
