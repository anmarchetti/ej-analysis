import { fireEvent, render, screen } from '@testing-library/react';

import { PaymentMethodCard } from './PaymentMethodCard';

const mockRadioButton = jest.fn();
jest.mock('frontend/components/common/RadioButton', () => {
    const MockRadioButtonComponent = (props: any) => {
        mockRadioButton(props);

        return (
            <div data-tid='mock-radio-button'>
                <input type='radio' id={props.id} name={props.name} checked={props.checked} readOnly={props.readOnly} />
                <label htmlFor={props.id}>{props.label}</label>
            </div>
        );
    };

    return MockRadioButtonComponent;
});

describe('<PaymentMethodCard />', () => {
    const resetMocks = () =>
        ({
            checkboxId: 'checkboxId',
            title: 'title',
            isSelected: false,
            onSelect: jest.fn(),
        } as any);

    let props = resetMocks();

    beforeEach(() => {
        props = resetMocks();
    });

    it('should render correctly with default props and call onSelect when clicked if not selected', async () => {
        render(<PaymentMethodCard {...props} />);

        const titleElement = screen.getByText(props.title);
        const cardElement = titleElement.closest('.payment-card');

        expect(cardElement).toBeInTheDocument();
        expect(cardElement).toHaveClass('payment-card');
        expect(cardElement).not.toHaveClass('selected');
        expect(cardElement).toHaveAttribute('data-tid', props.checkboxId);

        fireEvent.click(cardElement!);

        expect(props.onSelect).toHaveBeenCalledTimes(1);
    });

    it('should have the "selected" class when isSelected is true', () => {
        props.isSelected = true;

        render(<PaymentMethodCard {...props} />);

        const titleElement = screen.getByText(props.title);
        const cardElement = titleElement.closest('.payment-card');

        expect(cardElement).toHaveClass('selected');
    });

    it('should NOT call onSelect when clicked if it is already selected', async () => {
        props.isSelected = true;

        render(<PaymentMethodCard {...props} />);

        const titleElement = screen.getByText(props.title);
        const cardElement = titleElement.closest('.payment-card');

        fireEvent.click(cardElement!);

        expect(props.onSelect).not.toHaveBeenCalled();
    });

    it('should render children content', () => {
        const childText = 'This is child content';
        props.children = <p>{childText}</p>;

        render(<PaymentMethodCard {...props} />);

        expect(screen.getByText(childText)).toBeInTheDocument();
    });

    it('should apply additional className when provided', () => {
        const customClass = 'my-custom-card-style';
        props.className = customClass;

        render(<PaymentMethodCard {...props} />);

        const titleElement = screen.getByText(props.title);
        const cardElement = titleElement.closest('.payment-card');

        expect(cardElement).toHaveClass('payment-card');
        expect(cardElement).toHaveClass(customClass);
    });

    it('should apply fullscreen class when isFullScreen is true', () => {
        props.isFullScreen = true;

        render(<PaymentMethodCard {...props} />);

        const titleElement = screen.getByText(props.title);
        const cardElement = titleElement.closest('.payment-card');

        expect(cardElement).toHaveClass('payment-card--fullscreen');
    });

    it('should render simple title and apply not-selectable class when notSelectable is true', () => {
        props.notSelectable = true;

        render(<PaymentMethodCard {...props} />);

        const titleElement = screen.getByText(props.title);
        const cardElement = titleElement.closest('.payment-card');

        expect(cardElement).toHaveClass('payment-card--not-selectable');
        expect(mockRadioButton).not.toHaveBeenCalled();
        expect(titleElement).toHaveClass('radio__label');
        expect(titleElement.tagName).toBe('DIV');
    });

    it('should call onSelect when notSelectable is true and card is clicked (if not already selected)', async () => {
        props.notSelectable = true;
        props.isSelected = false;

        render(<PaymentMethodCard {...props} />);

        const titleElement = screen.getByText(props.title);
        const cardElement = titleElement.closest('.payment-card');

        fireEvent.click(cardElement!);

        expect(props.onSelect).toHaveBeenCalledTimes(1);
    });
});
