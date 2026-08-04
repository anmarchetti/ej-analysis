import { createContext, FC, useContext, useState } from 'react';

import settings from 'code/settings';
import useUniqueId from 'frontend/hooks/useUniqueId';
import isBackend from 'frontend/utils/isBackend';
import { toKebabCase } from 'frontend/utils/string.utils';
import { setBodyOverflow } from 'frontend/utils/ui.utils';
import { ExportFileTypes } from 'models/enum/ExportFileTypes';

export interface IPoster {
    activeId: Nullable<string>;
    downloadPoster: (name: string, type?: ExportFileTypes, hasLargeFormat?: boolean) => Promise<void>;
    hasEjLogo: boolean;
    hasUMLogo: boolean;
    isError: boolean;
    posterId: string;
    setError: (state: boolean) => void;
    toggleEjLogo: () => void;
    togglePoster: (id?: Nullable<string>) => void;
    toggleUMLogo: () => void;
}

const PosterContext = createContext({} as ReturnType<typeof useProvider>);

const INITIAL_EJ_LOGO_STATE = false;
const INITIAL_UM_LOGO_STATE = false;

const useProvider = (): IPoster => {
    const posterId = useUniqueId('poster');
    const [activeId, setActiveId] = useState<Nullable<string>>(null);
    const [isError, setIsError] = useState(false);
    const [hasEjLogo, setHasEjLogo] = useState(INITIAL_EJ_LOGO_STATE);
    const [hasUMLogo, setHasUMLogo] = useState(INITIAL_UM_LOGO_STATE);

    const togglePoster = (id?: Nullable<string>) => {
        setActiveId(id || null);
        setBodyOverflow(id ? '' : 'hidden');
        setHasEjLogo(INITIAL_EJ_LOGO_STATE);
        setHasUMLogo(INITIAL_UM_LOGO_STATE);
    };

    const toggleEjLogo = () => {
        if (!hasEjLogo) {
            setHasUMLogo(false);
        }

        setHasEjLogo(state => !state);
    };
    const toggleUMLogo = () => {
        if (!hasUMLogo) {
            setHasEjLogo(false);
        }

        setHasUMLogo(state => !state);
    };

    const setError = (state: boolean) => setIsError(state);

    const downloadPoster = async (name: string, type = ExportFileTypes.PDF, hasLargeFormat = false) => {
        if (isBackend()) {
            return;
        }

        try {
            const element = document.getElementById(posterId)?.cloneNode(true) as HTMLElement;

            if (element && type === ExportFileTypes.PDF) {
                element.classList.add('pdf-format');
            }

            const generateFile = await import('lib/generate-pdf');

            generateFile.default(element, type, {
                ...(name ? { filename: toKebabCase(name) } : {}),
                jsPDF: {
                    ...(hasLargeFormat ? { format: 'a3' } : {}),
                    ...(type === ExportFileTypes.PNG
                        ? {
                              unit: 'px',
                              format: [settings.TradePortal.ExportImageSizePx, settings.TradePortal.ExportImageSizePx],
                          }
                        : []),
                },
            });
        } catch (error) {
            togglePoster();
            setError(true);
        }
    };

    return {
        activeId,
        isError,
        hasEjLogo,
        hasUMLogo,
        posterId,
        togglePoster,
        downloadPoster,
        setError,
        toggleEjLogo,
        toggleUMLogo,
    };
};

export const usePoster = (): IPoster => useContext(PosterContext);

export interface IPosterProvider {
    children: React.ReactNode;
}

export const PosterProvider: FC<IPosterProvider> = ({ children }) => {
    const provider = useProvider();

    return <PosterContext.Provider value={provider}>{children}</PosterContext.Provider>;
};
