import React from 'react';
import { render } from '@testing-library/react';

import SelectBoardTypeError, { ISelectBoardTypeErrorProps } from './SelectBoardTypeError';

const createProps = (): ISelectBoardTypeErrorProps => ({
    errorMessage: 'test',
});

let props;

describe('SelectBoardTypeError', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        const { container } = render(<SelectBoardTypeError {...props} />);

        expect(container.querySelector('.board-and-room__error')).toBeInTheDocument();
        expect(container.querySelector('.px-4.py-2.row.board-and-room__error__label.my-2')).toBeInTheDocument();
        expect(container.querySelector('.board-and-room__error__label')).toContainElement(
            container.querySelector('.fa-exclamation-circle'),
        );
        expect(container.querySelector('.board-and-room__error__label')).toHaveTextContent(props.errorMessage);
    });
});
