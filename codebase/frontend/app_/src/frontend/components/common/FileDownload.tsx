import React, { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import Axios, { AxiosResponse } from 'axios';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays/create-stores';
import { FileType } from 'models/enum/FileType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ChecklistSvg from 'frontend/components/icons-new/Checklist';

import FloatingPopup from './FloatingPopup/FloatingPopup';
import Button, { IButtonProps } from './Button';

import styles from './FileDownload.module.scss';

export interface IFileDownloadProps extends IButtonProps {
    fileName: string;
    fileType: FileType;
    fileURL: string;
    ariaLabel?: string;
    buttonClassName?: string;
    buttonDataTid?: string;
    children?: any;
    errorMessage?: string;
    fileRequestData?: unknown;
    onClick?: () => void;
    showLoginPopup?: boolean;
}

export const FileDownload: FC<IFileDownloadProps> = ({
    fileName,
    fileType,
    fileURL,
    fileRequestData,
    buttonClassName,
    buttonDataTid,
    onClick,
    showLoginPopup,
    ariaLabel,
    errorMessage,
    children,
    ...buttonProps
}) => {
    const { getPhrase, setIsRedirectPreventedAfterLogin, toggleLoginPopup } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        setIsRedirectPreventedAfterLogin: isHolidayStore(stores) && stores.userStore.setIsRedirectPreventedAfterLogin,
        toggleLoginPopup: isHolidayStore(stores) && stores.userStore.toggleLoginPopup,
    }));

    const [isLoading, setIsLoading] = useState(false);
    const [isFailPopupShown, setIsFailPopupShown] = useState(false);
    const [cachedFile, setCachedFile] = useState<Nullable<{ blob: Blob; requestKey: string }>>(undefined);

    if (!fileURL || !fileName || !fileType) {
        return null;
    }

    const requestKey = JSON.stringify({ fileURL, fileRequestData });

    const downloadFile = (file: Blob): void => {
        /* IE11 fix */
        if (navigator.msSaveOrOpenBlob) {
            navigator.msSaveOrOpenBlob(file, fileName);

            return;
        }

        const fakeLink = document.createElement('a');
        fakeLink.setAttribute('href', window.URL.createObjectURL(file));
        fakeLink.setAttribute('download', fileName);
        fakeLink.click();
    };

    const onClickDownloadButton = async (): Promise<void> => {
        if (showLoginPopup && setIsRedirectPreventedAfterLogin && toggleLoginPopup) {
            setIsRedirectPreventedAfterLogin(true);
            toggleLoginPopup();

            return;
        }

        if (isLoading) {
            return;
        }

        onClick?.();

        if (cachedFile?.requestKey === requestKey) {
            downloadFile(cachedFile.blob);

            return;
        }

        try {
            setIsLoading(true);
            const response: AxiosResponse<BlobPart> = await Axios({
                method: fileRequestData ? 'post' : 'get',
                url: fileURL,
                data: fileRequestData,
                responseType: 'blob',
                headers: { Accept: fileType },
            });

            const newFile = new Blob([response.data], { type: fileType });
            setCachedFile({ blob: newFile, requestKey });
            setIsLoading(false);
            downloadFile(newFile);
        } catch {
            setIsLoading(false);
            setIsFailPopupShown(true);
        }
    };

    return (
        <>
            <Button
                isLoading={isLoading}
                className={buttonClassName}
                onClick={onClickDownloadButton}
                data-tid={buttonDataTid}
                aria-label={ariaLabel}
                {...buttonProps}
            >
                {children}
            </Button>

            {isFailPopupShown && (
                <FloatingPopup
                    onClose={(): void => setIsFailPopupShown(false)}
                    bodyClass={styles.bodyClass}
                    footerClass={styles.footer}
                    footerContent={
                        <Button
                            onClick={(): void => setIsFailPopupShown(false)}
                            isOutlined
                            className={styles.btnSecondary}
                            data-tid='button-secondary'
                        >
                            {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                        </Button>
                    }
                >
                    <div className={styles.header}>
                        <ChecklistSvg className={styles.icon} />
                        <Text
                            field={{
                                value:
                                    errorMessage ||
                                    getPhrase(SitecoreDictionary.BookingDocumentsPopupLabelsGeneratingReport),
                            }}
                            className={styles.title}
                            tag='h3'
                        />
                    </div>
                </FloatingPopup>
            )}
        </>
    );
};

export default FileDownload;
