import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import {
    collapsibleLinksFieldsMock,
    collapsibleLinksParamsMock,
    mockLinks,
} from 'frontend/components/renderings/CollapsibleLinksModule/__mocks__/collapsibleLinksMocks';

import { ILinksListProps, LinksList } from './LinksList';

const createProps = (): ILinksListProps => ({
    fields: collapsibleLinksFieldsMock,
    params: collapsibleLinksParamsMock,
    rendUid: '123',
    maxLinksInColumn: 2,
    links: mockLinks.map(l => l.fields.Link),
    listIndex: 1,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkProps(props);

        return (
            <button data-tid='router-link' onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: () => <div data-tid='jss-next-image' />,
}));

describe('LinksList', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render all links', () => {
        render(<LinksList {...mockProps} />);

        expect(mockRouterLinkProps).toHaveBeenCalledTimes(5);
        expect(screen.getAllByTestId('jss-next-image').length).toBe(5);
        const allLinks = screen.getAllByTestId('router-link');
        mockProps.links.forEach((l, i) => {
            expect(allLinks[i]).toHaveTextContent(l!.value.text);
        });
    });

    it('should call trackHomepageAction when click on link', async () => {
        render(<LinksList {...mockProps} />);

        await userEvent.click(screen.getAllByRole('button')[1]);

        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalledWith(EventTypes.HolidayWithUs, {
            location: mockProps.fields.Title.value,
            name: mockLinks[1].fields.Link.value.text,
            destination: 'sitePathlink-2',
        });
    });

    describe('trackModuleClick', () => {
        it('should be called when IsModuleClickTrackingEnabled = 1', async () => {
            render(<LinksList {...mockProps} />);

            await userEvent.click(screen.getAllByRole('button')[1]);

            expect(mockStores.trackingStore.trackModuleClick).toHaveBeenCalledWith({
                moduleId: mockProps.rendUid,
                name: mockProps.fields.Title.value,
                location: mockProps.params.ModuleLocation,
                selection: mockLinks[1].fields.Link.value.text,
                position: 4,
                destinationPath: mockLinks[1].fields.Link.value.href,
            });
        });

        it('should NOT be called when IsModuleClickTrackingEnabled = 0', async () => {
            mockProps.params.IsModuleClickTrackingEnabled = '';

            render(<LinksList {...mockProps} />);

            await userEvent.click(screen.getAllByRole('button')[1]);

            expect(mockStores.trackingStore.trackModuleClick).not.toHaveBeenCalled();
        });
    });
});
