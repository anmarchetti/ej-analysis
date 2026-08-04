import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { specialRequestsFields } from 'frontend/components/renderings/SpecialRequests/__mocks__/SpecialRequestsFields';

import ExtrasSpecialRequests from './ExtrasSpecialRequests';

const mockHook = {
    requests: [],
    alerts: [],
    handlePreselectedDismissal: jest.fn(),
};

jest.mock('frontend/hooks/useSpecialRequests', () => jest.fn(() => mockHook));

const mockSpecialRequestsAlerts = jest.fn();

jest.mock(
    'frontend/components/renderings/SpecialRequests/components/SpecialRequestsAlerts/SpecialRequestsAlerts',
    () => ({
        __esModule: true,
        default: props => {
            mockSpecialRequestsAlerts(props);

            return <div data-tid='special-requests-alerts' />;
        },
    }),
);

const mockSpecialAssistance = jest.fn();

jest.mock('frontend/components/renderings/SpecialRequests/components/SpecialAssistance/SpecialAssistance', () => ({
    __esModule: true,
    default: props => {
        mockSpecialAssistance(props);

        return <div data-tid='special-assistance' />;
    },
}));

const mockExtrasSpecialRequestsDrawer = jest.fn();

jest.mock(
    'frontend/components/renderings/SpecialRequests/components/ExtrasSpecialRequestsDrawer/ExtrasSpecialRequestsDrawer',
    () => ({
        __esModule: true,
        default: props => {
            mockExtrasSpecialRequestsDrawer(props);

            return <div data-tid='extras-special-requests-drawer' />;
        },
    }),
);

const mockContradictorySpecialRequestPopup = jest.fn();

jest.mock(
    'frontend/components/renderings/SpecialRequests/components/ContradictorySpecialRequestPopup/ContradictorySpecialRequestPopup',
    () => ({
        _esModule: true,
        ContradictorySpecialRequestPopup: props => {
            mockContradictorySpecialRequestPopup(props);

            return <div data-tid='contradictory-special-request-popup' />;
        },
    }),
);

const mockRichTextWithLinkComponent = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinkComponent(props);

        return <div dangerouslySetInnerHTML={{ __html: props.field.value }} data-tid='rich-text-with-link' />;
    },
}));

const mockText = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='text' />;
    },
}));

const mockJSSImage = jest.fn();

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const createProps = () => ({
    fields: specialRequestsFields,
});

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ExtrasSpecialRequests />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isSpecialRequestEnabled: true,
            },
            bookingStore: {
                toggleSpecialRequest: jest.fn(),
                isEligibleToAddSpecialRequest: true,
            },
            appStore: {
                isScreenLessMedium: false,
            },
        });
    });

    it('should call SpecialRequestsAlerts with correct props', () => {
        render(<ExtrasSpecialRequests {...props} />);

        expect(mockSpecialRequestsAlerts).toHaveBeenCalledWith({ alerts: mockHook.alerts });
    });

    it('should call SpecialAssistance with correct props', () => {
        render(<ExtrasSpecialRequests {...props} />);

        expect(mockSpecialAssistance).toHaveBeenCalledWith({ fields: props.fields });
    });

    it('should call ExtrasSpecialRequestsDrawer with correct props', () => {
        render(<ExtrasSpecialRequests {...props} />);

        expect(mockExtrasSpecialRequestsDrawer).toHaveBeenCalledWith({
            fields: props.fields,
            isOpen: false,
            requests: mockHook.requests,
            onSelectRequest: expect.any(Function),
            handlePreselectedDismissal: mockHook.handlePreselectedDismissal,
            onClose: expect.any(Function),
            alerts: mockHook.alerts,
        });
    });

    it('should call ContradictorySpecialRequestPopup with correct props', () => {
        render(<ExtrasSpecialRequests {...props} />);

        expect(mockContradictorySpecialRequestPopup).toHaveBeenCalledWith({
            fields: props.fields,
            contradictoryOptions: undefined,
            onSubmit: expect.any(Function),
            onCancel: expect.any(Function),
        });
    });

    it('Should render title, description, image, cta', () => {
        render(<ExtrasSpecialRequests {...props} />);

        expect(mockText).toHaveBeenCalledWith({
            field: props.fields.Title,
            tag: 'h3',
            className: 'headerTitle',
            'data-tid': 'extras-special-requests-title',
        });
        expect(mockRichTextWithLinkComponent).toHaveBeenCalledWith({
            field: props.fields.Description,
            tag: 'div',
            className: 'text',
            dataId: 'extras-special-requests-description',
        });
        expect(mockJSSImage).toHaveBeenCalledWith({ field: props.fields.AmendRequestIcon, className: 'image' });
        expect(screen.getByRole('button', { name: props.fields.AddRequestsCTA.value })).toBeInTheDocument();
    });

    it('Should NOT render title, description, image, cta when isEligibleToAddSpecialRequest is false', () => {
        mockStores.bookingStore.isEligibleToAddSpecialRequest = false;
        render(<ExtrasSpecialRequests {...props} />);

        expect(mockText).not.toHaveBeenCalled();
        expect(mockRichTextWithLinkComponent).not.toHaveBeenCalled();
        expect(mockJSSImage).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: props.fields.AddRequestsCTA.value })).not.toBeInTheDocument();
    });
});
