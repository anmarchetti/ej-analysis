import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import FastTrackAndServiceLine, { TFastTrackAndServiceLineProps } from './FastTrackAndServiceLine';

const createProps = (): TFastTrackAndServiceLineProps => ({
    FastTrackLabel: mockSitecoreField('FastTrackLabel'),
    ServiceLineLabel: mockSitecoreField('ServiceLineLabel'),
});

let mockProps = createProps();

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

const mockPhoneFilled = jest.fn();
jest.mock('frontend/components/icons-new/PhoneFilled', () => ({
    __esModule: true,
    default: props => {
        mockPhoneFilled(props);

        return <div data-tid='phone-filled' />;
    },
}));

const mockFastTrackFilled = jest.fn();
jest.mock('frontend/components/icons-new/FastTrackFilled', () => ({
    __esModule: true,
    default: props => {
        mockFastTrackFilled(props);

        return <div data-tid='fast-track-filled' />;
    },
}));

describe('FastTrackAndServiceLine', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        render(<FastTrackAndServiceLine {...mockProps} />);

        expect(screen.getAllByTestId('sitecore-jss-text')).toHaveLength(2);
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.FastTrackLabel,
            tag: 'span',
            className: 'blockTitle',
            'data-tid': 'label',
        });

        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.ServiceLineLabel,
            tag: 'span',
            className: 'blockTitle',
            'data-tid': 'label',
        });

        expect(screen.getByTestId('fast-track-filled')).toBeInTheDocument();
        expect(mockFastTrackFilled).toHaveBeenCalledWith({
            className: 'icon',
            'data-tid': 'icon',
        });
        expect(screen.getByTestId('phone-filled')).toBeInTheDocument();
        expect(mockPhoneFilled).toHaveBeenCalledWith({
            className: 'icon',
            'data-tid': 'icon',
        });
    });
});
