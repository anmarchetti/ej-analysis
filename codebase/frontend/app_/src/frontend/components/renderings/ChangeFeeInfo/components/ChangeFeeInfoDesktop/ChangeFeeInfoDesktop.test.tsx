import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IChangeFeeInfoFields } from 'frontend/components/renderings/ChangeFeeInfo/ChangeFeeInfo';

import ChangeFeeInfoDesktop from './ChangeFeeInfoDesktop';

import styles from './ChangeFeeInfoDesktop.module.scss';

expect.extend(toHaveNoViolations);

const createMockProps = () => ({
    descriptionText: 'Description £20',
    fields: {
        BucketTwoDescription: mockSitecoreField('BucketTwoDescription'),
        Description: mockSitecoreField('Description'),
        Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
        Title: mockSitecoreField('Title'),
        ViewLessCTA: mockSitecoreField('ViewLessCTA'),
        ViewMoreCTA: mockSitecoreField('ViewMoreCTA'),
    } as IChangeFeeInfoFields,
});

const resizeComponent = el => {
    Object.defineProperty(el, 'scrollWidth', { value: 500 });
    Object.defineProperty(el, 'clientWidth', { value: 100 });
};

let mockProps = createMockProps();

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({ field }) => (
    <img alt='image' src={field.value.src} />
));
jest.mock('frontend/components/common/Button', () => ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
));
jest.mock('@sitecore-jss/sitecore-jss-react', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-react'),
    RichText: ({ field }) => field.value,
}));

describe('<ChangeFeeInfoDesktop />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('renders correctly with required props', () => {
        render(<ChangeFeeInfoDesktop {...mockProps} />);

        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description £20')).toBeInTheDocument();
        expect(screen.getByAltText('image')).toHaveAttribute('src', 'Icon');
        expect(screen.getByTestId('change-fee-info-wrapper')).toHaveClass('wrapper fee-banner-desktop');
        expect(screen.getByTestId('change-fee-info-container')).toHaveClass('container stuck');
    });

    it('does not render if fields are not provided', () => {
        const { container } = render(<ChangeFeeInfoDesktop {...mockProps} fields={null as any} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should show ViewMoreCTA on overflow', () => {
        render(<ChangeFeeInfoDesktop {...mockProps} />);
        const textElement = screen.getByText('Description £20');
        let viewMoreCTA = screen.queryByText('ViewMoreCTA');

        expect(viewMoreCTA).not.toBeInTheDocument();

        resizeComponent(textElement);

        fireEvent(window, new Event('resize'));

        viewMoreCTA = screen.getByText('ViewMoreCTA');

        expect(viewMoreCTA).toBeInTheDocument();
    });

    it('Should toggles isExpanded state and changes layout on click', async () => {
        render(<ChangeFeeInfoDesktop {...mockProps} />);
        const textElement = screen.getByText('Description £20');

        resizeComponent(textElement);

        fireEvent(window, new Event('resize'));

        const viewMoreCTA = screen.getByText('ViewMoreCTA');
        const chevronIcon = screen.getByTestId('svg-chevron-down');

        expect(viewMoreCTA).toBeInTheDocument();
        expect(textElement).toHaveClass(styles.isCollapsed);
        expect(screen.queryByText('ViewLessCTA')).not.toBeInTheDocument();
        expect(chevronIcon).not.toHaveClass('icon--reflect-y');

        fireEvent.click(viewMoreCTA);

        await waitFor(() => {
            expect(screen.getByText('ViewLessCTA')).toBeInTheDocument();
            expect(chevronIcon).toHaveClass('icon--reflect-y');
            expect(textElement).not.toHaveClass(styles.isCollapsed);
            expect(screen.queryByText('ViewMoreCTA')).not.toBeInTheDocument();
        });
    });

    test('updates isStuck based on scroll position', async () => {
        const stickyBox = document.createElement('div');
        // @ts-ignore next-line
        jest.spyOn(document, 'querySelectorAll').mockReturnValue([stickyBox]);
        jest.spyOn(stickyBox, 'offsetHeight', 'get').mockReturnValue(70);

        const mockGetBoundingClientRect = jest.fn();

        render(<ChangeFeeInfoDesktop {...mockProps} />);

        const feeContainer = screen.getByTestId('change-fee-info-container');
        const feeWrapper = screen.getByTestId('change-fee-info-wrapper');

        feeWrapper.getBoundingClientRect = mockGetBoundingClientRect.mockReturnValue({ top: 80 });
        fireEvent.scroll(window, { target: { scrollY: 150 } });
        expect(feeContainer).not.toHaveClass('stuck');

        feeWrapper.getBoundingClientRect = mockGetBoundingClientRect.mockReturnValue({ top: 50 });
        await waitFor(() => {
            fireEvent.scroll(window, { target: { scrollY: 180 } });
            expect(feeContainer).toHaveClass('container stuck');
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<ChangeFeeInfoDesktop {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
