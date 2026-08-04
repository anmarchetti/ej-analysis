import { render, screen } from '@testing-library/react';

import ListedItem, { IListedItemProps } from './ListedItem';

const mockJSSImageNext = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageNext(props);

        return <div data-tid='jss-image' />;
    },
}));

let mockProps: IListedItemProps;

describe('<Listeditem />', () => {
    beforeEach(() => {
        mockProps = {
            className: 'test-class',
            icon: {
                alt: 'Test Icon',
                src: 'test-icon.png',
            },
            text: 'Test Text',
        };
    });

    it('should render with default props', () => {
        const { container } = render(<ListedItem {...mockProps} />);

        expect(container).toBeInTheDocument();
        expect(mockJSSImageNext).toHaveBeenCalledWith({
            'data-tid': 'Test Icon_icon',
            field: {
                value: {
                    src: 'test-icon.png',
                },
            },
            height: 24,
            mediaSize: 'small',
            width: 24,
        });
    });

    it('should NOT render when both icon and text is undefined', () => {
        const { container } = render(<ListedItem />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render img when icon is undefined', () => {
        mockProps.icon = undefined;

        render(<ListedItem {...mockProps} />);

        expect(mockJSSImageNext).not.toHaveBeenCalled();
        expect(screen.getByText(mockProps.text!)).toBeInTheDocument();
    });

    it('should NOT render text when text is undefined', () => {
        const text = mockProps.text!;
        mockProps.text = undefined;

        render(<ListedItem {...mockProps} />);

        expect(mockJSSImageNext).toHaveBeenCalled();
        expect(screen.queryByText(text)).not.toBeInTheDocument();
    });
});
