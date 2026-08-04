using System.Text;

namespace easyJet.Holidays.Api.Domain.Utils
{
    public static class Base64Helper
    {
        public static string Encode(string plaintext)
        {
            var valueBytes = Encoding.UTF8.GetBytes(plaintext);
            return Convert.ToBase64String(valueBytes);
        }

        public static string Decode(string base64String)
        {
            var valueBytes = Convert.FromBase64String(base64String);
            return Encoding.UTF8.GetString(valueBytes);
        }

        public static string Encode(byte[] data)
        {
            return Convert.ToBase64String(data);
        }
    }
}
