/**
 * @function encodeBase64URL
 *
 * @desc Takes a string and encodes it as a base64url string
 * (https://en.wikipedia.org/wiki/Base64#URL_applications)
 * (See also https://tools.ietf.org/html/rfc7515)
 *
 * @example const jsonStr = JSON.stringify( {name:'john', surname:'smith'} );
 *          const base64url = base64URL.encode(jsonStr);
 *
 * @param dataStr {String} - data, as a string, to be encoded
 *
 * @returns base64url {String} : a base64url encoded string
 */
export function encodeBase64URL(data) {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const base64 = window.btoa(dataStr);
    let base64url = base64.split('=')[0]; // Remove any trailing '='s

    base64url = base64url.replace(/\+/g, '-'); // 62nd char of encoding
    base64url = base64url.replace(/\//g, '_'); // 63rd char of encoding

    return base64url;
}
