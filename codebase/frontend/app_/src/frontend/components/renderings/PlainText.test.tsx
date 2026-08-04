import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import PlainText, { IPlainTextSitecoreFields, IPlainTextSitecoreParams } from './PlainText';

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field, ...props }) => {
        mockTextComponent(props);

        return <div data-tid='text-component'>{field.value}</div>;
    },
}));

describe('<PlainText />', () => {
    const resetMocks = () =>
        ({
            fields: {
                'Plain Text': mockSitecoreField('Plain Text'),
            },
            params: {
                Tag: 'p',
            },
        } as ISitecoreComponent<IPlainTextSitecoreFields, IPlainTextSitecoreParams>);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT render when fields are NOT provided', () => {
        mocks.fields = undefined;

        const { container } = render(<PlainText {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when Plain Text is NOT provided', () => {
        mocks.fields = {} as IPlainTextSitecoreFields;

        const { container } = render(<PlainText {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render Text component', () => {
        render(<PlainText {...mocks} />);

        expect(screen.getByTestId('text-component')).toHaveTextContent('Plain Text');
        expect(mockTextComponent).toHaveBeenCalledWith({
            tag: 'p',
            className: 'plainText',
        });
    });
});
