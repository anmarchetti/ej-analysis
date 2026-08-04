import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockCustomisableParams } from 'frontend/__mocks__/customisableParams';

import HolidaysUnder from './HolidaysUnder';

const createProps = () => ({
    fields: {
        Description: { value: 'description' },
        Title: { value: 'title' },
        Pills: [],
    },
    params: mockCustomisableParams,
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(),
        sitePath: 'path',
    },
    trackingStore: {
        trackEventWithParams: jest.fn(p => p),
    },
    queryParamStore: {},
    userStore: {},
    appStore: {},
});

const mockStores = createStores();
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HolidaysUnder />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should NOT render HolidaysUnder', () => {
        props.fields = null;
        const { container } = render(<HolidaysUnder {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render HolidaysUnder', () => {
        const { container } = render(<HolidaysUnder {...props} />);

        expect(container.getElementsByClassName('holidays-under')).toHaveLength(1);
    });

    it('should render all customisable class names', () => {
        const { container } = render(<HolidaysUnder {...props} />);

        const text = screen.getByRole('heading', { level: 3 });

        expect(text).toHaveClass('mobile-f14-desktop-f16');
        expect(text).toHaveClass('font-rounded');
        expect(text).toHaveClass('position-center');
        expect(text).toHaveClass('weight-200');
        expect(container.querySelector('.padding-24')).toBeInTheDocument();
    });

    it('Should render HolidaysUnder with 1 pill and no pound sign', () => {
        props.fields.Pills = [
            {
                fields: {
                    AutoTranslate: { value: false },
                    IsPpShown: { value: false },
                    Price: { value: 'pill' },
                    Link: { value: { href: 'link' } },
                },
                id: '1',
            },
        ];

        const { queryByText } = render(<HolidaysUnder {...props} />);
        expect(queryByText('£pill')).not.toBeInTheDocument();
    });
});
