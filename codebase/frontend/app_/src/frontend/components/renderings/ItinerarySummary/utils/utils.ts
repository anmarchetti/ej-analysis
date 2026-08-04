const PHONE_NUMBER_REGEX = /(?:[-+() ]{0,4}\d){10,13}/gm;
const URL_REGEX = /(https?:\/\/[^\s]*[^\s.,!?;:])/g;

export const formatPhoneNumbersAsLinks = (text: string): string => {
    const phoneNumbers = text.match(PHONE_NUMBER_REGEX);

    if (!phoneNumbers) {
        return text;
    }

    return phoneNumbers.reduce(
        (formattedText, phoneNumber) =>
            formattedText.replace(
                phoneNumber,
                ` <a href="tel:${phoneNumber.replaceAll(/\s/g, '')}">${phoneNumber.trim()}</a>`,
            ),
        text,
    );
};

export const formatLinksInText = (text: string): string => {
    const urls = text.match(URL_REGEX);

    if (!urls) {
        return text;
    }

    return urls.reduce(
        (formattedText, url) =>
            formattedText.replace(url, `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`),
        text,
    );
};
