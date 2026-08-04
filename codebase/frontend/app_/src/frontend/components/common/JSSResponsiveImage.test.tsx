import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { cmsUrls } from 'code/endpoints';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import * as MediaSizeParams from 'models/data/MediaSizeParams';

import { IJSSResponsiveImageProps, JSSResponsiveImage } from './JSSResponsiveImage';

const mockJssImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    JSSImage: props => {
        mockJssImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const resetMocks = () =>
    ({
        field: mockSitecoreField(mockSitecoreImageField('test')),
        params: {},
        rendering: {},
        isEditMode: false,
    } as IJSSResponsiveImageProps);

let mocks = resetMocks();

jest.mock('code/endpoints');
jest.spyOn(MediaSizeParams, 'getMediaSizeParams').mockReturnValue({
    mh: 10,
    mw: 20,
});

describe('<JSSResponsiveImage />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT render when src is NOT provided', () => {
        mocks.field.value = { src: '' };

        const { container } = render(<JSSResponsiveImage {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render Image when src is provided', () => {
        render(<JSSResponsiveImage {...mocks} />);

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJssImage).toHaveBeenCalledWith({
            className: undefined,
            field: { value: { src: undefined } },
            sizes: '(min-width: 20px) 20px, (min-width: 20px) 20px, (min-width: 20px) 20px, (min-width: 0px) 20px',
            src: undefined,
            srcSet: ['undefined 20w', 'undefined 20w', 'undefined 20w', 'undefined 20w'],
        });
    });

    it('should call cmsUrls.media when isEditMode is false', () => {
        mocks.isEditMode = false;

        render(<JSSResponsiveImage {...mocks} />);

        expect(cmsUrls.media).toHaveBeenCalledWith('test');
    });
});
