import html2pdf from 'html2pdf.js';

import settings from 'code/settings';
import { ExportFileTypes } from 'models/enum/ExportFileTypes';

type TImageType = 'jpeg' | 'png' | 'webp';
type TOrientation = 'portrait' | 'landscape';

interface IFileOpts {
    enableLinks?: boolean;
    filename?: string;
    html2canvas?: {
        allowTaint?: boolean;
        backgroundColor?: string;
        height?: number;
        logging?: boolean;
        proxy?: string;
        useCORS?: boolean;
        width?: number;
        windowWidth?: number;
    };
    image?: {
        quality?: number;
        type?: TImageType;
    };
    jsPDF?: {
        format?: string | [number, number];
        orientation?: TOrientation;
        unit?: string;
    };
    margin?: number | [number, number] | [number, number, number, number];
    pagebreak?: {
        mode?: string;
    };
}

const PDF_MARGIN_VERTICAL = 6;
const PDF_MARGIN_HORIZONTAL = 4;

const defaultOpts: IFileOpts = {
    filename: 'poster.pdf',
    margin: [PDF_MARGIN_VERTICAL, PDF_MARGIN_HORIZONTAL],
    image: { type: 'png', quality: 1 },
    pagebreak: { mode: 'css' },
    enableLinks: false,
    html2canvas: {
        allowTaint: true,
        logging: true,
        useCORS: true,
        proxy: 'easyjet-holidays-images-prod',
        windowWidth: 3600,
        backgroundColor: '#ffffff',
    },
    jsPDF: {
        format: 'a4',
    },
};

export const getImageDataUri = async (dom: HTMLElement): Promise<string> => {
    const size = settings.TradePortal.ExportImageSizePx;

    const opts: IFileOpts = {
        ...defaultOpts,
        margin: 0,
        html2canvas: {
            ...defaultOpts.html2canvas,
            width: size,
            height: size,
        },
        jsPDF: {
            unit: 'px',
            format: [size, size],
        },
    };

    return await html2pdf().set(opts).from(dom).toCanvas().toImg().outputImg('dataurlstring');
};

const generateFile = async (dom: HTMLElement, type = ExportFileTypes.PDF, customOpts?: IFileOpts): Promise<void> => {
    const opts: IFileOpts = {
        ...defaultOpts,
        ...customOpts,
        html2canvas: { ...defaultOpts.html2canvas, ...customOpts?.html2canvas },
        jsPDF: { ...defaultOpts.jsPDF, ...customOpts?.jsPDF },
    };

    if (type === ExportFileTypes.PDF) {
        await html2pdf().set(opts).from(dom).save();

        return;
    }

    const image = await getImageDataUri(dom);
    saveAs(image, `${opts.filename}.png`);
};

const saveAs = (uri: string, filename: string): void => {
    const link = document.createElement('a');

    if (typeof link.download !== 'string') {
        window.open(uri);

        return;
    }

    link.href = uri;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default generateFile;
