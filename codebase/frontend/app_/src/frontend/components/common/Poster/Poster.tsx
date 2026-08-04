import { FC } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';

import { PosterProvider, usePoster } from 'frontend/hooks/usePoster';
import { ExportFileTypes } from 'models/enum/ExportFileTypes';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Checkbox from 'frontend/components/common/Checkbox';
import FullScreenPopup from 'frontend/components/common/FullScreenPopup/FullScreenPopup';
import { Popup } from 'frontend/components/common/Popup';

import styles from './Poster.module.scss';

export interface IPosterFields {
    DownloadLabel?: ISitecoreField<string>;
    LogoCheckboxLabel?: ISitecoreField<string>;
    ReturnLabel?: ISitecoreField<string>;
    ShowAgentLogoCheckboxLabel?: ISitecoreField<string>;
}

interface IUniquePoster {
    children: React.ReactNode;
    id?: Nullable<string>;
}

interface INamedPoster extends IPosterFields {
    posterName: string;
    UMLogoImage?: string;
    hasLargeFormat?: boolean;
    hideButtons?: boolean;
    type?: ExportFileTypes;
}

type TPosterContent = INamedPoster & IUniquePoster;

export interface IPosterError {
    button: string;
    errorMessage: string;
    title: string;
}

const PosterHeader: FC<INamedPoster> = ({
    ShowAgentLogoCheckboxLabel,
    LogoCheckboxLabel,
    DownloadLabel,
    posterName,
    type,
    hasLargeFormat,
    hideButtons,
    UMLogoImage,
}) => {
    const { hasEjLogo, hasUMLogo, toggleEjLogo, toggleUMLogo, downloadPoster } = usePoster();

    if (hideButtons) {
        return null;
    }

    return (
        <div className={styles.barActions}>
            {LogoCheckboxLabel && (
                <div className={styles.checkbox}>
                    <Checkbox
                        disabled={hasUMLogo}
                        checked={hasEjLogo}
                        onChange={toggleEjLogo}
                        label={LogoCheckboxLabel.value}
                        dataTid='hide-ej-logo-checkbox'
                        tick
                        medium
                    />
                </div>
            )}
            {ShowAgentLogoCheckboxLabel && !!UMLogoImage && (
                <div className={styles.checkbox}>
                    <Checkbox
                        disabled={hasEjLogo}
                        checked={hasUMLogo}
                        onChange={toggleUMLogo}
                        label={ShowAgentLogoCheckboxLabel.value}
                        dataTid='hide-um-logo-checkbox'
                        tick
                        medium
                    />
                </div>
            )}
            {posterName && DownloadLabel && (
                <Button
                    onClick={() => downloadPoster(posterName, type, hasLargeFormat)}
                    className={styles.barAction}
                    dataTid='download-poster'
                >
                    {DownloadLabel.value}
                </Button>
            )}
        </div>
    );
};

const PosterTrigger: FC<IUniquePoster> = ({ children, id = null }) => {
    const { togglePoster } = usePoster();

    return <Slot onClick={() => togglePoster(id)}>{children}</Slot>;
};

const PosterContent: FC<TPosterContent> = props => {
    const { children, id, ReturnLabel, ...headerProps } = props;
    const { activeId, togglePoster } = usePoster();

    if (!activeId || activeId !== id) {
        return null;
    }

    return createPortal(
        <FullScreenPopup
            fields={{
                BackToLabel: ReturnLabel || { value: '' },
                BtnCancel: { value: '' },
            }}
            onClose={togglePoster}
            navigationActionBlock={<PosterHeader {...headerProps} />}
            isMobile={false}
            isInitialized={true}
            isInnerPopup
        >
            {children}
        </FullScreenPopup>,

        document.body,
    );
};

const PosterError: FC<IPosterError> = ({ title, errorMessage, button }) => {
    const { isError, setError } = usePoster();

    if (!isError) {
        return null;
    }

    return (
        <Popup
            title={title}
            containerClass={styles.errorPopup}
            onClose={() => setError(false)}
            id='poster-error'
            showCloseButton
        >
            <div className={styles.errorDescription}>{errorMessage}</div>
            <Button className={styles.errorButton} onClick={() => setError(false)}>
                {button}
            </Button>
        </Popup>
    );
};

export interface IPoster {
    children: React.ReactNode;
}

const Poster: FC<IPoster> = ({ children }) => <PosterProvider>{children}</PosterProvider>;

const Root = Poster;
const Trigger = PosterTrigger;
const Content = PosterContent;
const Error = PosterError;

export { Root, Trigger, Content, Error };
