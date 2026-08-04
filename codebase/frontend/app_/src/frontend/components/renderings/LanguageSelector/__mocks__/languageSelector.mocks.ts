export const mockSitecoreLangOption = (lang: string) => ({
    id: lang,
    fields: {
        Title: { value: lang },
        Code: { value: lang },
        Icon: { value: { src: `${lang}.png` } },
        IconCircle: { value: { src: `${lang}_circle.png` } },
    },
});
