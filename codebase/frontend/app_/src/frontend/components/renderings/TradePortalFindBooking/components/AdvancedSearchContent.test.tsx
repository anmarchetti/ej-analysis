import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AdvancedSearchContent from './AdvancedSearchContent';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Text: () => <div data-tid='text' />,
}));

const createProps = () => ({
    fields: {
        AdvancedSearchName: mockSitecoreField('AdvancedSearchName'),
    },
});

let props;

describe('<AdvancedSearchContent />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should render AdvancedSearchContent', () => {
        render(<AdvancedSearchContent {...props} />);

        expect(screen.getByTestId('text')).toBeInTheDocument();
    });

    it('Should NOT render AdvancedSearchContent', () => {
        props.fields = null;
        render(<AdvancedSearchContent {...props} />);

        expect(screen.queryByTestId('text')).not.toBeInTheDocument();
    });
});
