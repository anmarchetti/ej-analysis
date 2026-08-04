import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import InfoBlock, { IInfoBlockProps } from './InfoBlock';

expect.extend(toHaveNoViolations);

const buttonLabel = mockSitecoreField('buttonLabel');

const createProps = (): IInfoBlockProps => ({
    title: {
        value: 'title',
    },
    text: {
        value: 'text',
    },
    icon: {
        value: {
            src: 'icon',
        },
    },
    link: {
        value: {
            href: 'linkUrl',
            text: 'linkText',
            linktype: SitecoreLinkType.Internal,
        },
    },
    ctaClass: 'ctaClass',
    iconClass: 'iconClass',
    onClick: jest.fn(),
});

let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        layoutStore: {
            isEditMode: false,
        },
        appStore: {
            isScreenLessMedium: false,
        },
        routerStore: {
            redirectTo: '/',
        },
    }),
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: () => <div>JSSImage</div>,
}));
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: () => <div>RouterLink</div>,
}));
jest.mock('frontend/components/icons-new/InfoFilled', () => ({
    __esModule: true,
    default: () => <div>InfoFilled</div>,
}));
jest.mock('frontend/components/icons/WarningCircle', () => ({
    __esModule: true,
    default: () => <div>IconWarningCircle</div>,
}));

describe('<InfoBlock />', () => {
    afterAll(() => {
        mockProps = createProps();
    });

    it('Should render passed props', () => {
        render(<InfoBlock {...mockProps} />);

        expect(screen.getByText('title')).toBeTruthy();
        expect(screen.getByText('text')).toBeTruthy();
        expect(screen.getByText('RouterLink')).toBeTruthy();
        expect(screen.getByText('JSSImage')).toBeTruthy();

        expect(screen.queryByText('InfoFilled')).toBeNull();
        expect(screen.queryByText('IconWarningCircle')).toBeNull();
        expect(screen.getByTestId('info-block')).toBeInTheDocument();
        expect(screen.getByTestId('info-block-icon')).toHaveClass(mockProps.iconClass!);
    });

    it('Should render default icon when no icon and no isWarningIcon provided', () => {
        const { getByText } = render(<InfoBlock {...mockProps} icon={undefined} />);

        expect(screen.queryByText('IconWarningCircle')).not.toBeInTheDocument();
        expect(getByText('InfoFilled')).toBeTruthy();
    });

    it('Should render warning icon when no icon provided and isWarningIcon prop provided', () => {
        render(<InfoBlock {...mockProps} icon={undefined} withWarningIcon />);

        expect(screen.queryByText('IconWarningCircle')).toBeInTheDocument();
        expect(screen.getByText('IconWarningCircle')).toBeTruthy();
    });

    it('Should set data-tid correctly', () => {
        render(<InfoBlock {...mockProps} dataTid='custom' />);

        expect(screen.getByTestId('custom')).toBeInTheDocument();
        expect(screen.getByTestId('custom-title')).toBeInTheDocument();
        expect(screen.getByTestId('custom-text')).toBeInTheDocument();
    });

    it('should render custom icon when renderIcon is passed', () => {
        mockProps.renderIcon = () => <div data-tid='custom-icon' />;

        render(<InfoBlock {...mockProps} />);

        expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should apply titleClassName to title element when provided', () => {
        const { container } = render(<InfoBlock {...mockProps} titleClassName='custom-title-class' />);

        const titleElement = container.querySelector('h2.custom-title-class');
        expect(titleElement).toBeInTheDocument();
    });

    it('should apply contentClass to content container when provided', () => {
        render(<InfoBlock {...mockProps} contentClass='custom-content-class' />);

        const contentElement = screen.getByTestId('info-block-content');
        expect(contentElement).toHaveClass('custom-content-class');
    });

    it('should apply textClass to text when provided', () => {
        const { container } = render(<InfoBlock {...mockProps} textClass='custom-text-class' />);

        const textElement = container.querySelector('.custom-text-class');
        expect(textElement).toBeInTheDocument();
    });

    describe('button', () => {
        it('should render button WHEN onclick and buttonLabel exist', () => {
            render(<InfoBlock {...mockProps} btnLabel={buttonLabel} />);

            expect(screen.getByTestId('info-block-button')).toBeInTheDocument();
            expect(screen.getByTestId('info-block-button')).toHaveTextContent('buttonLabel');
            expect(screen.getByTestId('info-block-button')).toHaveClass(mockProps.ctaClass!);
        });

        it('should call onClick prop on button click', () => {
            render(<InfoBlock {...mockProps} btnLabel={buttonLabel} />);

            const button = screen.getByTestId('info-block-button');
            fireEvent.click(button);

            expect(screen.getByTestId('info-block-button')).toBeInTheDocument();
            expect(mockProps.onClick).toHaveBeenCalled();
        });

        it('should NOT render button when buttonLabel exists and onClick does NOT exist', () => {
            delete mockProps.onClick;

            render(<InfoBlock {...mockProps} btnLabel={buttonLabel} />);

            expect(screen.queryByTestId('info-block-button')).not.toBeInTheDocument();
        });

        it('should NOT render button when onClick exists and buttonLabel does NOT exist', () => {
            render(<InfoBlock {...mockProps} />);

            expect(screen.queryByTestId('info-block-button')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<InfoBlock {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
