import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { KeyboardKey } from 'models/enum/KeyboardKey';

import LandmarkLink from './LandmarkLink';

const resetMocks = () => ({
    linkTitle: 'linkTitle',
    sectionName: 'sectionName',
});

let mocks = resetMocks();

const targetId = 'targetId';
const section = document.createElement('div');
section.id = mocks.sectionName;
section.setAttribute('data-tid', targetId);
document.body.appendChild(section);

describe('<LandmarkLink />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render standard', () => {
        render(<LandmarkLink {...mocks} />);

        const wrapper = screen.getByTestId('landmark-link-box');
        const link = screen.getByTestId('landmark-link-element');

        expect(within(wrapper).getByTestId('landmark-link-element')).toBeInTheDocument();
        expect(link).toHaveTextContent(mocks.linkTitle);
        expect(link).toHaveAttribute('href', `#${mocks.sectionName}`);
        expect(link).toHaveAttribute('tabIndex', '0');
    });

    it('should call focus on click and set tabindex on target to -1 when element exists', () => {
        render(<LandmarkLink {...mocks} />);

        const link = screen.getByTestId('landmark-link-element');
        const target = screen.getByTestId(targetId);
        const focusMock = jest.fn();

        Object.defineProperty(target, 'focus', {
            value: focusMock,
            writable: true,
        });

        fireEvent.click(link);

        expect(target).toHaveAttribute('tabindex', '-1');
        expect(focusMock).toHaveBeenCalled();
    });

    it('should focus the target when press on space', () => {
        render(<LandmarkLink {...mocks} />);

        const target = screen.getByTestId(targetId);
        const focusMock = jest.fn();

        Object.defineProperty(target, 'focus', {
            value: focusMock,
            writable: true,
        });

        fireEvent.keyDown(screen.getByTestId('landmark-link-element'), { key: KeyboardKey.SPACE });

        expect(target).toHaveAttribute('tabindex', '-1');
        expect(focusMock).toHaveBeenCalled();
    });

    it('should NOT focus when element is missing', () => {
        render(<LandmarkLink {...mocks} />);

        const focusSpy = jest.spyOn(document, 'getElementById').mockReturnValue(null);

        fireEvent.click(screen.getByTestId('landmark-link-element'));

        expect(focusSpy).toHaveBeenCalledWith(mocks.sectionName);
    });
});
