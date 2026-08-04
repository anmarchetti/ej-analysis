import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendPaymentItemContainer, { IAmendPaymentItemContainerProps } from './AmendPaymentItemContainer';

expect.extend(toHaveNoViolations);

let mockProps: IAmendPaymentItemContainerProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockImageProps(props);

        return <div data-tid={props.dataTid} />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-react', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid={props['data-tid']} />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockButtonProps(props);

        return <div data-tid='button' onClick={onClick} />;
    },
}));

describe('<AmendPaymentAccordionItemContainer />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            children: <div data-tid='children' />,
            onContinue: jest.fn(),
            hideCta: false,
            icon: mockSitecoreField(mockSitecoreImageField('Icon')),
            title: mockSitecoreField('Title'),
            className: 'additional-class',
        };
    });

    it('Should render component', () => {
        render(<AmendPaymentItemContainer {...mockProps} />);

        expect(screen.getByTestId('accordion-container')).toBeInTheDocument();
        expect(screen.getByTestId('accordion-container')).toHaveClass('additional-class');
        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('accordion-container-icon')).toBeInTheDocument();
        expect(mockImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.icon,
                className: 'icon',
                dataTid: 'accordion-container-icon',
            }),
        );

        expect(screen.getByTestId('accordion-title')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.title,
                className: 'title',
                tag: 'h3',
                ['data-tid']: 'accordion-title',
            }),
        );

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isMedium: true,
                children: SitecoreDictionary.GlobalsButtonsContinue,
            }),
        );
    });

    it('Should render button with isFullWidth props on mobile', () => {
        mockStores.appStore.isScreenLessMedium = true;
        render(<AmendPaymentItemContainer {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isMedium: true,
                children: SitecoreDictionary.GlobalsButtonsContinue,
            }),
        );
    });

    it('Should NOT render button if hideCta prop has been passed', () => {
        mockProps.hideCta = true;
        render(<AmendPaymentItemContainer {...mockProps} />);

        expect(screen.queryByTestId('button')).not.toBeInTheDocument();
    });

    it('Should NOT render title if there are no title and icon', () => {
        mockProps.icon = null as any;
        mockProps.title = null as any;

        render(<AmendPaymentItemContainer {...mockProps} />);

        expect(screen.queryByTestId('accordion-title')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendPaymentItemContainer {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
