import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockAmendDatesStore } from 'frontend/__mocks__';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AmendPageHeader from './AmendPageHeader';

expect.extend(toHaveNoViolations);

const createProps = () => ({
    title: mockSitecoreField('title'),
    subtitle: mockSitecoreField('subtitle'),
    isAttentionMessageOn: true,
    rendering: 'rendering',
    breadcrumbRootPath: '/',
    breadcrumbRootText: 'breadcrumbRootText',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAmendDatesBreadcrumbsProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesBreadcrumbs/AmendDatesBreadcrumbs',
    () => ({
        __esModule: true,
        default: props => {
            mockAmendDatesBreadcrumbsProps(props);

            return <div data-tid='amend-dates-breadcrumbs' />;
        },
    }),
);

const mockAmendPageServiceMessagesProps = jest.fn();
jest.mock('frontend/components/common/AmendPageServiceMessages/AmendPageServiceMessages', () => ({
    __esModule: true,
    default: props => {
        mockAmendPageServiceMessagesProps(props);

        return <div data-tid='service-messages' />;
    },
}));

const mockWrapperProps = jest.fn();
jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockWrapperProps(props);

        return <div data-tid='component-wrapper'>{children}</div>;
    },
}));
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div>{field?.value}</div>,
}));

describe('<AmendPageHeader />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: mockAmendDatesStore,
        });
        mockProps = createProps();
    });

    describe('AmendPageServiceMessages render', () => {
        it('Should render AmendDatesServiceMessages', () => {
            render(<AmendPageHeader {...mockProps} />);

            expect(screen.getByTestId('service-messages')).toBeInTheDocument();
            expect(mockAmendPageServiceMessagesProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    rendering: mockProps.rendering,
                }),
            );
        });

        it('Should forward errataOverrides', () => {
            mockProps.errataOverrides = { date: '2024-11-01' };

            render(<AmendPageHeader {...mockProps} />);

            expect(mockAmendPageServiceMessagesProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    errataOverrides: mockProps.errataOverrides,
                }),
            );
        });

        it('Should NOT render AmendDatesServiceMessages', () => {
            mockProps.isAttentionMessageOn = false;

            render(<AmendPageHeader {...mockProps} />);

            expect(screen.queryByText('service-messages')).not.toBeInTheDocument();
        });
    });

    it('Render content', () => {
        render(<AmendPageHeader {...mockProps} />);

        expect(screen.getByTestId('component-wrapper')).toBeInTheDocument();
        expect(mockWrapperProps).toHaveBeenCalledWith(expect.objectContaining({ params: { IsGreyBackground: '1' } }));
        expect(screen.getByTestId('amend-dates-breadcrumbs')).toBeInTheDocument();
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByText('subtitle')).toBeInTheDocument();
        expect(mockAmendDatesBreadcrumbsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rootPath: '/',
                rootText: 'breadcrumbRootText',
            }),
        );
    });

    it('Render component wrapper with white background ', () => {
        mockProps.isBackgroundGrey = false;
        render(<AmendPageHeader {...mockProps} />);

        expect(screen.getByTestId('component-wrapper')).toBeInTheDocument();
        expect(mockWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({ params: { IsGreyBackground: undefined } }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendPageHeader {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
