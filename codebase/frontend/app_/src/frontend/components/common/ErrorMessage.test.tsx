import React from 'react';
import { render } from '@testing-library/react';

import ErrorMessage, { ERROR_MESSAGE_CLASSNAME } from './ErrorMessage';

jest.mock('./RouterLink', () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

const resetMocks = () => ({
    message: 'message',
    isWarning: false,
    IsNotification: false,
    IfIsNotificationOrange: false,
    IsSuccess: false,

    IsDesc: false,
    description: '',
    errorMessageClass: '',
    dataTid: '',
    isSmallText: false,
});

let mocks;

describe('<ErrorMessage />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('ErrorMessage should render', () => {
        it('Should standard', () => {
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector(`.${ERROR_MESSAGE_CLASSNAME}`)).toBeInTheDocument();
            expect(container.querySelector('.error-message__container')).toHaveTextContent('message');
            expect(container.querySelector('span.error-message__label')).not.toBeInTheDocument();
        });

        it('Should render with description', () => {
            mocks.description = 'description';
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message')).toBeInTheDocument();
            expect(container.querySelector('.error-message__label')).toHaveTextContent('message');
            expect(container.querySelector('.error-message__description')).toHaveTextContent('description');
        });
    });

    describe('ErrorMessage should render className', () => {
        it('Should render className error-message--yellow', () => {
            mocks.isWarning = true;
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message.error-message--yellow')).toBeInTheDocument();
        });

        it('Should render className error-message--blue', () => {
            mocks.IsNotification = true;
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message.error-message--blue')).toBeInTheDocument();
        });

        it('Should render className error-message--orange', () => {
            mocks.IfIsNotificationOrange = true;
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message.error-message--orange')).toBeInTheDocument();
        });

        it('Should render className error-message--green', () => {
            mocks.IsSuccess = true;
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message.error-message--green')).toBeInTheDocument();
        });

        it('Should render className error-message--with-desc', () => {
            mocks.IsDesc = true;
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message.error-message--with-desc')).toBeInTheDocument();
        });

        it('Should render className error-message--with-desc', () => {
            mocks.description = 'description';
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message.error-message--with-desc')).toBeInTheDocument();
        });

        it('Should render className errorMessageClass', () => {
            mocks.errorMessageClass = 'errorMessageClass';
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message.errorMessageClass')).toBeInTheDocument();
        });

        it('Should render className row', () => {
            mocks.btnLink = {};
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message')).toHaveClass('row');
        });

        it('Should render child with className col-sm-8 col-md-10', () => {
            mocks.btnLink = { value: { text: 'test' } };
            mocks.onClick = jest.fn();
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.d-flex')).toHaveClass('col-sm-8 col-md-10');
            expect(container.querySelector('.d-flex')).not.toHaveClass('col-sm-12');
        });

        it('Should render child with className col-sm-12 if onClick undefined', () => {
            mocks.btnLink = { value: { text: 'test' } };
            mocks.onClick = undefined;
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.d-flex')).toHaveClass('col-sm-12');
            expect(container.querySelector('.d-flex')).not.toHaveClass('col-sm-8 col-md-10');
        });

        it('Should render child with className col-sm-12 if btnLink undefined', () => {
            mocks.btnLink = undefined;
            mocks.onClick = {};
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.d-flex')).toHaveClass('col-sm-12');
            expect(container.querySelector('.d-flex')).not.toHaveClass('col-sm-8 col-md-10');
        });

        it('Should render error-text-small when text is small', () => {
            mocks.isSmallText = true;
            mocks.description = 'desc';
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message__label')).toHaveClass('error-text-small');
            expect(container.querySelector('.error-message__description')).toHaveClass('error-text-small');
        });

        it('Should NOT render error-text-small when text is NOT small', () => {
            mocks.description = 'desc';
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message__label')).not.toHaveClass('error-text-small');
            expect(container.querySelector('.error-message__description')).not.toHaveClass('error-text-small');
        });
    });

    describe('error-message__button', () => {
        it('Should NOT render error-message__button if btnLink is undefined', () => {
            mocks.btnLink = undefined;
            mocks.onClick = {};
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message__button')).not.toBeInTheDocument();
        });

        it('Should NOT render error-message__button if onClick is undefined', () => {
            mocks.btnLink = { value: { text: 'test' } };
            mocks.onClick = undefined;
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message__button')).not.toBeInTheDocument();
        });

        it('Should render error-message__button if btnLink & onClick are defined', () => {
            mocks.btnLink = { value: { text: 'test' } };
            mocks.onClick = {};
            const { container } = render(<ErrorMessage {...mocks} />);

            expect(container.querySelector('.error-message__button')).toBeInTheDocument();
        });
    });
});
