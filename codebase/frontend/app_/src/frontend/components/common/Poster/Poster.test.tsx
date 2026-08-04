import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockedPoster } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ExportFileTypes } from 'models/enum/ExportFileTypes';
import * as Poster from 'frontend/components/common/Poster';

const createPoster = () => mockedPoster;

let mockPoster = createPoster();

const Trigger = () => (
    <Poster.Trigger>
        <div data-tid='poster-trigger'>Trigger</div>
    </Poster.Trigger>
);

interface IContentProps {
    hideButtons?: boolean;
}

const Content = ({ hideButtons, ...props }: IContentProps) => (
    <Poster.Content
        DownloadLabel={mockSitecoreField('download')}
        LogoCheckboxLabel={mockSitecoreField('ej-logo-checkbox')}
        ShowAgentLogoCheckboxLabel={mockSitecoreField('um-logo-checkbox')}
        ReturnLabel={mockSitecoreField('return')}
        UMLogoImage='UMLogoImage'
        posterName='poster'
        id='default'
        type={ExportFileTypes.PDF}
        hasLargeFormat
        hideButtons={hideButtons || false}
        {...props}
    >
        <div data-tid='poster-content'>Content</div>
    </Poster.Content>
);
const Error = () => <Poster.Error title='Title' errorMessage='Error Message' button='Error Button' />;

jest.mock('frontend/hooks/usePoster', () => ({
    usePoster: () => mockPoster,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ id, children, title }) => (
        <div data-tid={id}>
            <span>Popup</span>
            <span>{title}</span>
            <div>{children}</div>
        </div>
    ),
}));

describe('<Poster />', () => {
    beforeEach(() => {
        mockPoster = createPoster();
        mockPoster.activeId = 'default';
    });

    describe('<Poster.Trigger>', () => {
        it('should render child element as poster trigger', () => {
            render(<Trigger />);

            expect(screen.getByTestId('poster-trigger')).toBeVisible();
        });

        it('should toggle poster when clicked', async () => {
            render(<Trigger />);

            await userEvent.click(screen.getByTestId('poster-trigger'));

            expect(mockPoster.togglePoster).toBeCalled();
        });
    });

    describe('<Poster.Header>', () => {
        it('should render poster header', () => {
            render(<Content />);

            expect(screen.getByTestId('hide-ej-logo-checkbox')).toBeInTheDocument();
            expect(screen.getByTestId('hide-um-logo-checkbox')).toBeInTheDocument();
            expect(screen.getByTestId('download-poster')).toBeInTheDocument();
        });

        it('should not render poster header when hideButtons is true', () => {
            render(<Content hideButtons />);

            expect(screen.queryByTestId('hide-ej-logo-checkbox')).not.toBeInTheDocument();
            expect(screen.queryByTestId('hide-um-logo-checkbox')).not.toBeInTheDocument();
            expect(screen.queryByTestId('download-poster')).not.toBeInTheDocument();
        });

        it('should NOT render ej-logo-checkbox when LogoCheckboxLabel is not defined', () => {
            const mockProps = { LogoCheckboxLabel: null } as IContentProps;

            render(<Content {...mockProps} />);

            expect(screen.queryByTestId('hide-ej-logo-checkbox')).not.toBeInTheDocument();
        });

        it('should NOT render um-logo-checkbox when ShowAgentLogoCheckboxLabel is not defined', () => {
            const mockProps = { ShowAgentLogoCheckboxLabel: null } as IContentProps;

            render(<Content {...mockProps} />);

            expect(screen.queryByTestId('hide-um-logo-checkbox')).not.toBeInTheDocument();
        });

        it('should NOT render um-logo-checkbox when UMLogoImage is not defined', () => {
            const mockProps = { UMLogoImage: null } as IContentProps;

            render(<Content {...mockProps} />);

            expect(screen.queryByTestId('hide-um-logo-checkbox')).not.toBeInTheDocument();
        });

        it('should call toggleEjLogo when ej-logo-checkbox is clicked', async () => {
            mockPoster.hasUMLogo = false;

            render(<Content />);

            await userEvent.click(screen.getByTestId('hide-ej-logo-checkbox'));

            await waitFor(() => {
                expect(mockPoster.toggleEjLogo).toHaveBeenCalled();
            });
        });

        it('should call toggleUMLogo when um-logo-checkbox is clicked', async () => {
            mockPoster.hasEjLogo = false;

            render(<Content />);

            await userEvent.click(screen.getByTestId('hide-um-logo-checkbox'));

            await waitFor(() => {
                expect(mockPoster.toggleUMLogo).toHaveBeenCalled();
            });
        });

        it('should download poster clicked', async () => {
            render(<Content />);

            await userEvent.click(screen.getByTestId('download-poster'));

            expect(mockPoster.downloadPoster).toBeCalledWith('poster', 0, true);
        });
    });

    describe('<Poster.Content>', () => {
        it('should not render popup', () => {
            mockPoster.activeId = null;

            render(<Content />);

            expect(screen.queryByTestId('poster-content')).toBeNull();
        });

        it('should render popup', () => {
            render(<Content />);

            expect(screen.getByTestId('poster-content')).toBeVisible();
        });
    });

    describe('<Poster.Error>', () => {
        it('should not render popup', () => {
            render(<Error />);

            expect(screen.queryByTestId('poster-error')).toBeNull();
        });

        it('should render popup', () => {
            mockPoster.isError = true;

            render(<Error />);

            expect(screen.getByTestId('poster-error')).toBeVisible();
            expect(screen.getByText('Title')).toBeVisible();
            expect(screen.getByText('Error Message')).toBeVisible();
            expect(screen.getByText('Error Button')).toBeVisible();
        });

        it('should trigger close error', async () => {
            mockPoster.isError = true;

            render(<Error />);

            await userEvent.click(screen.getByText('Error Button'));

            expect(mockPoster.setError).toBeCalled();
        });
    });
});
