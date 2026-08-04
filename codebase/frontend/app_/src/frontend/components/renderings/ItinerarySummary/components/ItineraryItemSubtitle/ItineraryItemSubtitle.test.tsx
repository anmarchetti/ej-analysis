import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ItineraryItemSubtitle, { TItineraryItemSubtitle } from './ItineraryItemSubtitle';

expect.extend(toHaveNoViolations);

const createProps = (): TItineraryItemSubtitle => ({
    subtitle: mockSitecoreField('test'),
    content: 'content',
    dataTid: 'subtitle-content',
    showSubtitle: true,
    showContent: true,
    icon: null,
    className: undefined,
    contentClassName: undefined,
    subtitleClassName: undefined,
});

let props: TItineraryItemSubtitle;

describe('<ItineraryItemSubtitle />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render subtitle and content', () => {
        render(<ItineraryItemSubtitle {...props} />);

        expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(props.subtitle!.value);
        expect(screen.getByTestId(props.dataTid!)).toHaveTextContent(props.content as string);
    });

    it('should NOT render if no content and showContent is true', () => {
        props.content = '';

        const { container } = render(<ItineraryItemSubtitle {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render without content when showContent is false', () => {
        props.showContent = false;

        render(<ItineraryItemSubtitle {...props} />);

        expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(props.subtitle!.value);
        expect(screen.queryByTestId(props.dataTid!)).not.toBeInTheDocument();
    });

    it('should NOT render if no subtitle and showSubtitle is true', () => {
        props.subtitle!.value = '';

        const { container } = render(<ItineraryItemSubtitle {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render if no subtitle and showSubtitle is false', () => {
        props.subtitle = undefined;
        props.showSubtitle = false;

        const { container } = render(<ItineraryItemSubtitle {...props} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(screen.getByTestId(props.dataTid!)).toHaveClass('withoutMargin');
    });

    it('should render icon when provided', () => {
        props.icon = <div data-tid='test-icon' />;

        render(<ItineraryItemSubtitle {...props} />);

        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should apply custom classNames', () => {
        props.className = 'custom-class';
        props.contentClassName = 'custom-content-class';
        props.subtitleClassName = 'custom-subtitle-class';

        render(<ItineraryItemSubtitle {...props} />);

        const container = screen.getByTestId(props.dataTid!).parentElement;
        expect(container).toHaveClass('custom-class');
        expect(screen.getByTestId(props.dataTid!)).toHaveClass('custom-content-class');
        expect(screen.getByRole('heading', { level: 5 })).toHaveClass('custom-subtitle-class');
    });

    it('should render JSX.Element as content', () => {
        props.content = <div data-tid='jsx-content'>JSX Content</div>;

        render(<ItineraryItemSubtitle {...props} />);

        expect(screen.getByTestId('jsx-content')).toHaveTextContent('JSX Content');
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<ItineraryItemSubtitle {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
