import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { defaultExperimentMock } from 'frontend/__mocks__/experiments';
import { ctaMock, getMockedBannerFields } from 'frontend/__mocks__/heroBanners';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { getHeroBannerControls } from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

import BoxWithRoundel, { IHeroBannerBoxWithRoundelProps } from './BoxWithRoundel';

const mockedCTA = ctaMock;
jest.mock('frontend/components/renderings/GenericHeroBanner/heroBanner.utils', () => ({
    getHeroBannerControls: jest.fn(() => [mockedCTA]),
}));

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextComponent(props);

        return <div data-tid='text'>{props.field.value}</div>;
    },
}));

const mockRouterLink = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockRouterLink(props);

        return <button data-tid='router-link' onClick={onClick} />;
    },
}));

const mockHeroBannerHeader = jest.fn();
jest.mock('frontend/components/renderings/GenericHeroBanner/components/HeroBannerHeader/HeroBannerHeader', () => ({
    __esModule: true,
    default: props => {
        mockHeroBannerHeader(props);

        return <div data-tid='hero-banner-header' />;
    },
}));

const createProps = (): IHeroBannerBoxWithRoundelProps => ({
    experiment: defaultExperimentMock,
    fields: getMockedBannerFields(),
    onClick: jest.fn(),
});

let mockProps: IHeroBannerBoxWithRoundelProps;

describe('BoxWithRoundel', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render default', () => {
        render(<BoxWithRoundel {...mockProps} />);

        expect(screen.getByTestId('hero-banner-header')).toBeInTheDocument();

        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.fields.TextBeforeNumber,
            tag: 'span',
        });
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.fields.TextAfterNumber,
            tag: 'span',
        });

        expect(mockRouterLink).toHaveBeenCalledWith({
            children: ctaMock.value.text,
            link: ctaMock,
            className: expect.stringContaining('control'),
        });

        expect(mockHeroBannerHeader).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });
    });

    it('should render with correct classNames when isMainBox is true', () => {
        mockProps.isMainBox = true;
        render(<BoxWithRoundel {...mockProps} />);

        expect(screen.getByTestId('hero-banner-content')).toHaveClass('stripeContent', 'mainBox');
    });

    it('should render with correct classNames when isSecondaryBox is true', () => {
        mockProps.isSecondaryBox = true;
        render(<BoxWithRoundel {...mockProps} />);

        expect(screen.getByTestId('hero-banner-content')).toHaveClass('stripeContent', 'secondaryBox');
    });

    describe('button rendering', () => {
        it('should display the button when the first control has a href', () => {
            render(<BoxWithRoundel {...mockProps} />);

            expect(screen.getByTestId('router-link')).toBeInTheDocument();
        });

        it('should NOT display the button when the first control does NOT have a href', () => {
            (getHeroBannerControls as jest.Mock).mockReturnValueOnce([mockSitecoreField({ text: 'No Link' })]);
            render(<BoxWithRoundel {...mockProps} />);

            expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
        });

        it('should call onClick when button clicked', async () => {
            render(<BoxWithRoundel {...mockProps} />);

            const button = screen.getByTestId('router-link');

            await userEvent.click(button);

            expect(mockProps.onClick).toHaveBeenCalledWith(expect.any(Object), ctaMock);
        });

        it('should pass correct className to button', () => {
            render(<BoxWithRoundel {...mockProps} />);

            expect(mockRouterLink).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'control',
                }),
            );
        });
    });

    describe('roundel rendering', () => {
        it('should display roundel and render Text Before Number when TextBeforeNumber has a value', () => {
            mockProps.fields.TextBeforeNumber.value = 'Save up to';
            mockProps.fields.NumberValue.value = '';
            mockProps.fields.TextAfterNumber.value = '';

            render(<BoxWithRoundel {...mockProps} />);

            expect(screen.getByTestId('hero-banner-roundel')).toBeInTheDocument();
            expect(mockTextComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: mockProps.fields.TextBeforeNumber,
                    tag: 'span',
                }),
            );
            expect(screen.getAllByText('Save up to').length).toBe(1);
        });

        it('should display roundel when NumberValue has a value', () => {
            mockProps.fields.TextBeforeNumber.value = '';
            mockProps.fields.NumberValue.value = '50';
            mockProps.fields.TextAfterNumber.value = '';

            render(<BoxWithRoundel {...mockProps} />);

            expect(screen.getByTestId('hero-banner-roundel')).toBeInTheDocument();
        });

        it('should display roundel and render Text After Number when TextAfterNumber has a value', () => {
            mockProps.fields.TextBeforeNumber.value = '';
            mockProps.fields.NumberValue.value = '';
            mockProps.fields.TextAfterNumber.value = 'Off';

            render(<BoxWithRoundel {...mockProps} />);

            expect(screen.getByTestId('hero-banner-roundel')).toBeInTheDocument();
            expect(mockTextComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: mockProps.fields.TextAfterNumber,
                    tag: 'span',
                }),
            );
            expect(screen.getAllByText('Off').length).toBe(1);
        });

        it('should display roundel when all text fields have values', () => {
            mockProps.fields.TextBeforeNumber.value = 'Save up to';
            mockProps.fields.NumberValue.value = '100';
            mockProps.fields.TextAfterNumber.value = 'Off';

            render(<BoxWithRoundel {...mockProps} />);

            expect(screen.getByTestId('hero-banner-roundel')).toBeInTheDocument();
        });

        it('should NOT display roundel when all text fields are empty', () => {
            mockProps.fields.TextBeforeNumber.value = '';
            mockProps.fields.NumberValue.value = '';
            mockProps.fields.TextAfterNumber.value = '';

            render(<BoxWithRoundel {...mockProps} />);

            expect(screen.queryByTestId('hero-banner-roundel')).not.toBeInTheDocument();
        });

        it('should apply slim header class when roundel is visible', () => {
            mockProps.fields.TextBeforeNumber.value = 'Save';
            mockProps.fields.NumberValue.value = '50';
            mockProps.fields.TextAfterNumber.value = 'Off';

            render(<BoxWithRoundel {...mockProps} />);

            const header = screen.getByTestId('hero-banner-header').parentElement;
            expect(header).toHaveClass('header slimHeader');
        });

        it('should NOT apply slim header class when roundel is not visible', () => {
            mockProps.fields.TextBeforeNumber.value = '';
            mockProps.fields.NumberValue.value = '0';
            mockProps.fields.TextAfterNumber.value = '';

            render(<BoxWithRoundel {...mockProps} />);

            const header = screen.getByTestId('hero-banner-header').parentElement;
            expect(header).toHaveClass('header');
        });
    });
});
