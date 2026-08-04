using System;
using System.Security.Cryptography;
using System.Text;

namespace easyJet.Foundation.HotelBeds.Security
{
    public static class SignatureHelper
    {
        public static string GenerateSignature(string apiKey, string secret)
        {
            using (var sha = SHA256.Create())
            {
                var ts = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds / 1000;
                var computedHash = sha.ComputeHash(Encoding.UTF8.GetBytes(apiKey + secret + ts));

                return BitConverter.ToString(computedHash).Replace("-", string.Empty);
            }
        }
    }
}