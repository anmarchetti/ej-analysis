using Microsoft.IdentityModel.Tokens;

namespace easyJet.Holidays.External.Domain.Utils
{
    /// <summary>
    /// Encodes and Decodes strings as Base64Url encoding
    /// </summary>
    public static class Base64Utils
    {
        /// <summary>
        /// Encodes strings as Base64Url encoding
        /// </summary>
        /// <param name="plainText"></param>
        /// <returns></returns>
        public static string Base64UrlEncode(string plainText)
        {
            if (string.IsNullOrWhiteSpace(plainText))
            {
                return plainText;
            }

            return Base64UrlEncoder.Encode(plainText);
        }

        /// <summary>
        /// Decodes strings as Base64Url encoding
        /// </summary>
        /// <param name="base64EncodedData"></param>
        /// <returns></returns>
        public static string Base64UrlDecode(string base64EncodedData)
        {
            if (string.IsNullOrWhiteSpace(base64EncodedData))
            {
                return base64EncodedData;
            }

            return Base64UrlEncoder.Decode(base64EncodedData);
        }
    }
}