import * as React from 'react';
import { render, screen } from '@testing-library/react';

import Schema from './Schema';

const createProps = () => ({
    fields: {
        Schema: { value: '{ "val": "test" }' },
        schema: '{ "val2": "test2" }',
    },
});

const createStores = () => ({
    layoutStore: {
        isHomePage: true,
    },
});

let mockProps;
let mockStores;

const mockInnerScript = jest.fn();

jest.mock('next/head', () => ({
    __esModule: true,
    default: ({ children }) => {
        mockInnerScript(children.props);

        return <div>Head</div>;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<Schema />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should standard render schema on homepage', () => {
        render(<Schema {...mockProps} />);

        expect(screen.getByText('Head')).toBeInTheDocument();
        expect(mockInnerScript).toBeCalledWith(
            expect.objectContaining({ dangerouslySetInnerHTML: { __html: '{"val":"test"}' } }),
        );
    });

    it('Should standard render schema on other pages', () => {
        mockProps.fields.Schema = undefined;
        mockStores.layoutStore.isHomePage = false;

        render(<Schema {...mockProps} />);

        expect(screen.getByText('Head')).toBeInTheDocument();
        expect(mockInnerScript).toBeCalledWith(
            expect.objectContaining({ dangerouslySetInnerHTML: { __html: '{"val2":"test2"}' } }),
        );
    });

    it('Should NOT render a component when schema field is undefined', () => {
        mockProps.fields = undefined;

        render(<Schema {...mockProps} />);

        expect(screen.queryByText('Head')).not.toBeInTheDocument();
    });
});
