import React from 'react';
import { beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import CountdownTimer, { ICountdownTimerProps } from './CountdownTimer';
import * as utils from './CountdownTimer.utils';

const mockRichTextWithLinks = jest.fn();
const noWrapContainerClass = ' noWrapContainer';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    RichTextWithLinks: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const createProps = (): ICountdownTimerProps => ({
    date: mockSitecoreField(''),
    field: mockSitecoreField(''),
    className: 'default-class',
});

let mockProps;

describe('<CountdownTimer />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render when countdown data is not null', () => {
        jest.spyOn(utils, 'default').mockReturnValue({
            days: 1,
            hours: 2,
            minutes: 3,
            seconds: 4,
        });
        mockProps.field = mockSitecoreField('{days} {hours} {minutes} {seconds}');

        render(<CountdownTimer {...mockProps} />);

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            className: mockProps.className + noWrapContainerClass,
            field: {
                value: "<span class='countdownTimerItem'>1</span> <span class='countdownTimerItem'>2</span> <span class='countdownTimerItem'>3</span> <span class='countdownTimerItem'>4</span>",
            },
        });
    });

    it('should NOT render when countdown is null', () => {
        jest.spyOn(utils, 'default').mockReturnValue(null);

        render(<CountdownTimer {...mockProps} />);

        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });
});
