import { ExportFileTypes } from 'models/enum/ExportFileTypes';

import * as generateFunctions from './generate-pdf';

const mockSet = jest.fn();
const mockSave = jest.fn();
const mockToCanvas = jest.fn();
const mockToImg = jest.fn();
const mockOutputImg = jest.fn().mockResolvedValue('test-src');

const mockHtml2CanvasObject = {
    allowTaint: true,
    logging: true,
    proxy: 'easyjet-holidays-images-prod',
    backgroundColor: '#ffffff',
    useCORS: true,
    windowWidth: 3600,
};

jest.mock('html2pdf.js', () => ({
    __esModule: true,
    default: () => ({
        set: props => {
            mockSet(props);

            return {
                from: () => ({
                    save: mockSave,
                    toCanvas: () => {
                        mockToCanvas();

                        return {
                            toImg: () => {
                                mockToImg();

                                return {
                                    outputImg: mockOutputImg,
                                };
                            },
                        };
                    },
                }),
            };
        },
    }),
}));

const el = document.createElement('div');

describe('generateFile', () => {
    describe('default', () => {
        it('should set options', () => {
            generateFunctions.default(el, ExportFileTypes.PDF, {
                filename: 'test-name',
                enableLinks: false,
            });

            expect(mockSet).toHaveBeenCalledWith({
                enableLinks: false,
                filename: 'test-name',
                html2canvas: mockHtml2CanvasObject,
                image: { quality: 1, type: 'png' },
                jsPDF: { format: 'a4' },
                margin: [6, 4],
                pagebreak: { mode: 'css' },
            });
        });

        it('should override options', () => {
            generateFunctions.default(el, ExportFileTypes.PDF, {
                filename: 'test',
                enableLinks: false,
                html2canvas: { logging: false },
                jsPDF: {
                    format: 'a3',
                },
            });

            expect(mockSet).toHaveBeenCalledWith({
                enableLinks: false,
                filename: 'test',
                html2canvas: { ...mockHtml2CanvasObject, logging: false },
                image: { quality: 1, type: 'png' },
                jsPDF: { format: 'a3' },
                margin: [6, 4],
                pagebreak: { mode: 'css' },
            });
        });

        it('should save pdf', () => {
            generateFunctions.default(el, ExportFileTypes.PDF, {
                filename: 'test',
                enableLinks: false,
            });
            expect(mockSave).toBeCalled();
        });

        it('should save png', async () => {
            const mockedLink = { click: jest.fn(), download: 'download' } as any;
            const appendChild = jest.fn();
            const removeChild = jest.fn();

            jest.spyOn(document, 'createElement').mockReturnValue(mockedLink);
            jest.spyOn(document.body, 'appendChild').mockImplementation(appendChild);
            jest.spyOn(document.body, 'removeChild').mockImplementation(removeChild);

            await generateFunctions.default(el, ExportFileTypes.PNG, {
                filename: 'test-filename',
                enableLinks: false,
            });

            expect(mockedLink.href).toEqual('test-src');
            expect(mockedLink.download).toEqual('test-filename.png');
            expect(mockedLink.click).toBeCalled();
            expect(appendChild).toBeCalledWith(mockedLink);
            expect(removeChild).toBeCalledWith(mockedLink);
        });
    });

    describe('getImageDataUri', () => {
        it('should set options with custom dimensions', async () => {
            await generateFunctions.getImageDataUri(el);

            expect(mockSet).toHaveBeenCalledWith({
                enableLinks: false,
                filename: 'poster.pdf',
                html2canvas: {
                    ...mockHtml2CanvasObject,
                    width: 500,
                    height: 500,
                },
                image: {
                    quality: 1,
                    type: 'png',
                },
                jsPDF: {
                    unit: 'px',
                    format: [500, 500],
                },
                margin: 0,
                pagebreak: {
                    mode: 'css',
                },
            });
        });

        it('should call toCanvas', async () => {
            await generateFunctions.getImageDataUri(el);

            expect(mockToCanvas).toHaveBeenCalled();
        });

        it('should call toImg', async () => {
            await generateFunctions.getImageDataUri(el);

            expect(mockToImg).toHaveBeenCalled();
        });

        it('should call outputImg with dataurlstring', async () => {
            await generateFunctions.getImageDataUri(el);

            expect(mockOutputImg).toHaveBeenCalledWith('dataurlstring');
        });

        it('should return new src', async () => {
            const result = await generateFunctions.getImageDataUri(el);

            expect(result).toEqual('test-src');
        });
    });
});
