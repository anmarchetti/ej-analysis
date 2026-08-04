import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import EcoCertifiedPill from 'frontend/components/common/EcoCertifiedPill';

jest.mock('frontend/components/icons-new/ChevronDown.tsx', () => ({
    __esModule: true,
    default: ({ className }) => <svg className={className} data-tid='icon-svg' />,
}));

jest.mock('frontend/components/icons-new/EcoCertified', () => ({
    __esModule: true,
    default: () => <div data-tid='icon-eco' />,
}));

const mockProps = {
    title: 'title',
    tooltip: 'Tooltip',
    isNewPill: false,
    className: 'test',
};

let mockStores;

jest.spyOn(React, 'useContext').mockImplementation(() => mockStores);

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => props => {
    mockCalloutProps(props);

    return <div data-tid='callout'>{props.children}</div>;
});

const mockPillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/Pill/Pill', () => ({
    __esModule: true,
    default: ({ icon, onClick, onMouseEnter, ...props }) => {
        mockPillComponent(props);

        return (
            <div data-tid='pill'>
                {icon}
                <button data-tid='pill-click' onClick={onClick} onKeyDown={jest.fn()} />
                <button data-tid='pill-hover' onClick={onMouseEnter} onKeyDown={jest.fn()} />
            </div>
        );
    },
}));

describe('<EcoCertifiedPill />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            trackingStore: { trackEcoCertified: jest.fn() },
            layoutStore: {
                isEcoCertifiedEnabledOnSearchPage: true,
            },
        });
    });

    it('Should render', () => {
        render(<EcoCertifiedPill {...mockProps} />);

        expect(screen.getByText('title')).toBeInTheDocument();
        expect(mockCalloutProps).toHaveBeenCalledWith(
            expect.objectContaining({
                orientation: CalloutOrientation.Top,
                position: CalloutPosition.Right,
                isShownOnHover: true,
                enablePrintMode: true,
            }),
        );
    });

    it('should NOT render when eco-pill is disabled', () => {
        mockStores.layoutStore.isEcoCertifiedEnabledOnSearchPage = false;

        const { container } = render(<EcoCertifiedPill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should not render tooltip if tooltip prop is not provided', () => {
        render(<EcoCertifiedPill {...mockProps} />);

        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    it('should render pill when isNewPill is true', () => {
        mockProps.isNewPill = true;

        render(<EcoCertifiedPill {...mockProps} />);

        expect(screen.getByTestId('pill')).toBeInTheDocument();
        expect(screen.getByTestId('icon-eco')).toBeInTheDocument();
        expect(mockPillComponent).toHaveBeenCalledWith({
            contentClass: 'pill test',
            title: 'title',
            text: 'Tooltip',
            dataTid: 'eco-certified-pill',
        });
    });

    it('should call trackEcoCertified on pill click', async () => {
        mockProps.isNewPill = true;

        render(<EcoCertifiedPill {...mockProps} />);

        await userEvent.click(screen.getByTestId('pill-click'));

        expect(mockStores.trackingStore.trackEcoCertified).toHaveBeenCalledWith(EventTypes.EcoCertifiedIcon, 'click');
    });

    it('should call trackEcoCertified on pill hover', async () => {
        mockProps.isNewPill = true;

        render(<EcoCertifiedPill {...mockProps} />);

        await userEvent.click(screen.getByTestId('pill-hover'));

        expect(mockStores.trackingStore.trackEcoCertified).toHaveBeenCalledWith(EventTypes.EcoCertifiedIcon, 'hover');
    });
});
