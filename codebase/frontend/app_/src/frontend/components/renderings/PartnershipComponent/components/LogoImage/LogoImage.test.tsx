import React from 'react';
import { act, render, screen, within } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';

import LogoImage, { ILogoImageProps } from './LogoImage';

const mockJSSImageComponent = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageComponent(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockConditionalWrapperComponent = jest.fn();
jest.mock('frontend/components/common/ConditionalWrapper/ConditionalWrapper', () => ({
    __esModule: true,
    default: props => {
        mockConditionalWrapperComponent(props);

        return <div data-tid='conditional-wrapper'>{props.wrapper(props.children)}</div>;
    },
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

describe('<LogoImage />', () => {
    const resetMocks = (): ILogoImageProps => ({
        isStandardTheme: true,
        image: mockSitecoreField(mockSitecoreImageField('image')),
        isBgTransparent: true,
        shouldWrap: false,
    });
    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT render when no image provided', () => {
        mocks.image = undefined;
        const { container } = render(<LogoImage {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render when image provided', async () => {
        await act(async () => {
            render(<LogoImage {...mocks} />);
        });

        expect(screen.getByTestId('partnership-logo')).toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'logo',
                field: mocks.image,
                height: 1,
                mediaSize: MediaSize.Small,
                width: 1,
            }),
        );
    });

    it('should render ConditionalWrapper truthy', async () => {
        mocks.shouldWrap = true;
        await act(async () => {
            render(<LogoImage {...mocks} />);
        });

        expect(screen.getByTestId('conditional-wrapper')).toBeInTheDocument();
        expect(mockConditionalWrapperComponent).toHaveBeenCalledWith(expect.objectContaining({ condition: true }));
    });

    it('should render ConditionalWrapper falsy', async () => {
        mocks.shouldWrap = false;
        await act(async () => {
            render(<LogoImage {...mocks} />);
        });

        expect(screen.getByTestId('conditional-wrapper')).toBeInTheDocument();
        expect(mockConditionalWrapperComponent).toHaveBeenCalledWith(expect.objectContaining({ condition: false }));
    });

    it('should render component wrapper within ConditionalWrapper', async () => {
        await act(async () => {
            render(<LogoImage {...mocks} />);
        });

        expect(within(screen.getByTestId('conditional-wrapper')).getByTestId('component-wrapper')).toBeInTheDocument();
    });

    it('should create sizes properly', async () => {
        if (mocks.image?.value) {
            mocks.image.value = { ...mocks.image?.value, width: 400, height: 200 };
            await act(async () => {
                render(<LogoImage {...mocks} />);
            });

            expect(mockJSSImageComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'logo',
                    field: { value: { height: 200, src: 'image', width: 400 } },
                    height: 55,
                    mediaSize: 'small',
                    width: 110,
                }),
            );
        }
    });
});
