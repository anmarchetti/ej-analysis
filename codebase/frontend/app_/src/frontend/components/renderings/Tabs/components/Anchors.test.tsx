import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { scrollToElement } from 'frontend/utils/ui.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { generateAnchorMocksArray } from 'frontend/components/renderings/Tabs/__mocks__/createAnchors';

import Anchors, { OffsetFromElementClassName, TAnchorsProps } from './Anchors';

const createProps = (): TAnchorsProps => ({
    items: generateAnchorMocksArray(3),
    link: mockSitecoreField(mockSitecoreLinkField('/test', 'test', SitecoreLinkType.External)),
    reviews: 1,
    isSticky: false,
});

const mockAnchorComponent = jest.fn();
const mockRouterLinkComponent = jest.fn();
let props;

jest.mock('./Anchor', () => ({
    __esModule: true,
    default: props => {
        mockAnchorComponent(props);

        const anchorValue = props.fields.Anchor.value;

        return (
            <div data-tid='anchor'>
                {props.isActive && 'active'}
                {props.onClick && (
                    <button onClick={() => props.onClick({ preventDefault: jest.fn() }, anchorValue)}>
                        {anchorValue}
                    </button>
                )}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkComponent(props);

        return <div data-tid='router-link'>{props.children}</div>;
    },
}));

const mockUseAnchorHighlight = jest.fn();
jest.mock('frontend/hooks/useAnchorScrollTracker', () => ({
    __esModule: true,
    useAnchorScrollTracker: props => {
        mockUseAnchorHighlight(props);
        const result = [...props.items];
        result[2] = { ...result[2], isActive: true };

        return props.items.length ? result : props.items;
    },
}));

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToElement: jest.fn(),
}));

describe('<Anchors />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        render(<Anchors {...props} />);

        expect(screen.getAllByTestId('anchor')).toHaveLength(3);
        expect(mockAnchorComponent).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                fields: props.items[2].fields,
                reviews: props.reviews,
                isActive: true,
            }),
        );
        expect(mockRouterLinkComponent).toHaveBeenCalled();
        expect(mockUseAnchorHighlight).toHaveBeenCalledWith({
            baseOffset: 70,
            items: props.items.map(item => ({ id: item.fields.Anchor.value })),
            keepTabSelection: true,
        });
    });

    it('should set third anchor as active', async () => {
        render(<Anchors {...props} />);

        expect(screen.getAllByTestId('anchor')[1]).not.toHaveTextContent('active');
        expect(screen.getAllByTestId('anchor')[2]).toHaveTextContent('active');
    });

    it('should rendered nothing if no fields and no link', async () => {
        props.items = undefined;
        props.link = undefined;
        const { container } = render(<Anchors {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('scroll to element', () => {
        beforeEach(() => {
            jest.spyOn(document, 'getElementById').mockReturnValueOnce({ offsetTop: 100 } as HTMLElement);
            jest.spyOn(document, 'getElementsByClassName').mockReturnValueOnce([{ offsetHeight: 50 }] as any);
        });

        it('should scrollToElement with correct offset value when anchor link was clicked', async () => {
            render(<Anchors {...props} />);

            await userEvent.click(screen.getByRole('button', { name: props.items[2].fields.Anchor.value }));

            expect(document.getElementsByClassName).toHaveBeenCalledWith(OffsetFromElementClassName.BASKET);
            expect(scrollToElement).toHaveBeenCalledWith({ offsetTop: 100 }, 50);
        });

        it('should use correct offset value when the anchor bar has sticky type and anchor link was clicked', async () => {
            props.isSticky = true;

            render(<Anchors {...props} />);

            await userEvent.click(screen.getByRole('button', { name: props.items[2].fields.Anchor.value }));

            expect(document.getElementsByClassName).toHaveBeenCalledWith(OffsetFromElementClassName.ANCHORS);
            expect(scrollToElement).toHaveBeenCalledWith({ offsetTop: 100 }, 50);
        });
    });

    it('should NOT initiate scroll to element when it is not exist', async () => {
        jest.spyOn(document, 'getElementById').mockReturnValueOnce(null);

        render(<Anchors {...props} />);

        await userEvent.click(screen.getByRole('button', { name: props.items[2].fields.Anchor.value }));

        expect(document.getElementsByClassName).not.toHaveBeenCalled();
        expect(scrollToElement).not.toHaveBeenCalled();
    });

    it('should set offsetTop to zero when there is no element to be indented from', async () => {
        jest.spyOn(document, 'getElementById').mockReturnValueOnce({ offsetTop: 100 } as HTMLElement);
        jest.spyOn(document, 'getElementsByClassName').mockReturnValueOnce([] as any);

        render(<Anchors {...props} />);

        await userEvent.click(screen.getByRole('button', { name: props.items[2].fields.Anchor.value }));

        expect(document.getElementsByClassName).toHaveBeenCalled();
        expect(scrollToElement).toHaveBeenCalledWith({ offsetTop: 100 }, 0);
    });

    it('should NOT display the anchor-box when items do not have anchor values', async () => {
        props.items = [{ fields: { Anchor: { value: '' } } }];

        render(<Anchors {...props} />);

        expect(screen.queryByTestId('anchor-links-box')).not.toBeInTheDocument();
    });

    it('should NOT display router link when link is not defined in the props', async () => {
        props.link = undefined;

        render(<Anchors {...props} />);

        expect(mockRouterLinkComponent).not.toHaveBeenCalled();
    });
});
