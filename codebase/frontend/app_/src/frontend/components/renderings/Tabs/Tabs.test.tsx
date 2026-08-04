import * as React from 'react';
import { render } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import Tabs, { TTabsProps } from './Tabs';

const createProps = (): TTabsProps => ({
    fields: {
        Children: [],
        CTA: mockSitecoreField(mockSitecoreLinkField('/test', 'test', SitecoreLinkType.External)),
    },
    params: {
        IsSticky: false,
    },
    rendering: {},
});

const mockAnchorsComponent = jest.fn();
let props;

jest.mock('./components/Anchors', () => ({
    __esModule: true,
    default: props => {
        mockAnchorsComponent(props);

        return <div />;
    },
}));

describe('<Tabs />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render the anchors component with correct props', () => {
        props.fields.Children = new Array(5).fill({ fields: {} });

        render(<Tabs {...props} />);

        expect(mockAnchorsComponent).toHaveBeenCalledWith({
            isSticky: false,
            link: props.fields.CTA,
            items: props.fields.Children,
        });
    });

    it('should pass isSticky prop to the anchors component when it is set in sitecore parameters', () => {
        props.params.IsSticky = true;

        render(<Tabs {...props} />);

        expect(mockAnchorsComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isSticky: true,
            }),
        );
    });

    it('should render when only the CTA is defined', () => {
        render(<Tabs {...props} />);

        expect(mockAnchorsComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                items: [],
                link: props.fields.CTA,
            }),
        );
    });

    it('should render when only children fields are defined', () => {
        props.fields.Children = [{ fields: {} }];
        props.fields.CTA = undefined;

        render(<Tabs {...props} />);

        expect(mockAnchorsComponent).toHaveBeenCalledWith({
            items: props.fields.Children,
            isSticky: false,
        });
    });

    it('should NOT render without sitecore fields', () => {
        props.fields = undefined;

        const { container } = render(<Tabs {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
