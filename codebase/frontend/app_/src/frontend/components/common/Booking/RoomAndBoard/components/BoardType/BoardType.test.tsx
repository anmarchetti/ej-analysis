import React from 'react';
import { render, screen } from '@testing-library/react';

import BoardType from './BoardType';

const mockImageWithFilterComponent = jest.fn();

jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: props => {
        mockImageWithFilterComponent(props);

        return <div data-tid='image-with-filter'>ImageWithFilter</div>;
    },
    SVGFilterMatrix: () => ({}),
}));

jest.mock('frontend/components/icons-new/FullBoard', () => ({
    __esModule: true,
    default: () => <div data-tid='svg-full-board'>SvgFullBoard</div>,
}));

const createProps = () => ({
    board: {
        code: 'HB',
        title: 'Half board',
        content: 'content',
        iconUrl: '/-/jssmedia/ee09ab1161a34c1e93d08579844d9db0.ashx',
    },
    isPrintPreview: false,
});

let props;

describe('<BoardType />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should not render anything if board not provided', () => {
        props.board = undefined;
        const { container } = render(<BoardType {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render ImageWithFilter if iconUrl is set', () => {
        render(<BoardType {...props} />);

        expect(mockImageWithFilterComponent).toBeCalledWith({
            filterMatrix: undefined,
            imageSrc: 'undefined/-/jssmedia/ee09ab1161a34c1e93d08579844d9db0.ashx',
            isPrintPreview: false,
        });
        expect(screen.getByTestId('image-with-filter')).toBeInTheDocument();
    });

    it('should render SvgFullBoard if no iconUrl is set', () => {
        props.board.iconUrl = undefined;
        render(<BoardType {...props} />);

        expect(screen.getByTestId('svg-full-board')).toBeInTheDocument();
    });
});
