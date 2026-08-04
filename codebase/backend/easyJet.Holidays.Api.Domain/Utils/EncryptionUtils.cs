using System.Globalization;
using System.Runtime.Serialization.Json;
using System.Security.Cryptography;
using System.Text;

namespace easyJet.Holidays.Api.Domain.Utils
{
    /// <summary> 
    /// NOTE: Code copied from easyjet.com
    /// </summary>
    public static class EncryptionUtils
    {
        // As provided by easyJet - please do not change
        public static string EncryptValue(string value, string encryptionPassword, string encryptionSalt)
        {
            byte[] buffer = Encrypt(value, encryptionPassword, encryptionSalt);

            StringBuilder sb = new StringBuilder();

            for (int i = 0; i < buffer.Length; i++)
            {
                sb.Append(buffer[i].ToString("x", CultureInfo.InvariantCulture).PadLeft(2, '0'));
            }

            return sb.ToString();
        }

        // As provided by easyJet - please do not change
        public static string DecryptValue(string value, string encryptionPassword, string encryptionSalt)
        {
            StringBuilder sb = new StringBuilder(value);

            int positionInValue = 0;
            int bufferPos = 0;

            byte[] buffer = new byte[sb.Length / 2];

            while (bufferPos < buffer.Length && positionInValue < sb.Length)
            {
                buffer[bufferPos] = Byte.Parse(sb.ToString(positionInValue, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture);
                positionInValue += 2;
                bufferPos++;
            }

            return Decrypt<string>(buffer, encryptionPassword, encryptionSalt);
        }

        /// <summary>
        /// Encrypts the passed value.
        /// </summary>
        /// <param name="valueToEncrypt">The value to encrypt.</param>
        /// <returns>A string representing the encrypted value.</returns>
        public static byte[] Encrypt(object valueToEncrypt, string encryptionPassword, string encryptionSalt)
        {
            if (valueToEncrypt == null)
            {
                throw new ArgumentNullException("valueToEncrypt");
            }

            byte[] serializedValue = SerializeTheValue(valueToEncrypt);

            return EncryptData(serializedValue, encryptionPassword, encryptionSalt);
        }

        /// <summary>
        /// Encrypts the passed value.
        /// </summary>
        /// <param name="valueToDecrypt">The value to decrypt.</param>
        /// <returns>An object representing the decrypted value.</returns>
        /// <typeparam name="T">The type of object being decrypted.</typeparam>
        public static T Decrypt<T>(byte[] valueToDecrypt, string encryptionPassword, string encryptionSalt)
        {
            if (valueToDecrypt == null)
            {
                throw new ArgumentNullException("valueToDecrypt");
            }

            byte[] decryptedBytes = DecryptData(valueToDecrypt, encryptionPassword, encryptionSalt);

            return DeserializeTheDecryptedValue<T>(decryptedBytes);
        }

        private static byte[] SerializeTheValue(object value)
        {
            using (MemoryStream memoryStream = new MemoryStream())
            {
                DataContractJsonSerializer serializer = new DataContractJsonSerializer(value.GetType());

                serializer.WriteObject(memoryStream, value);

                return memoryStream.ToArray();
            }
        }

        private static T DeserializeTheDecryptedValue<T>(byte[] bytes)
        {
            using (MemoryStream memoryStream = new MemoryStream(bytes))
            {
                DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(T));

                return (T)serializer.ReadObject(memoryStream);
            }
        }

        private static byte[] EncryptData(byte[] bytes, string encryptionPassword, string encryptionSalt)
        {
            var keyDeriver = new Rfc2898DeriveBytes(encryptionPassword, Encoding.UTF8.GetBytes(encryptionSalt));
            var aes = Aes.Create();
            aes.Key = keyDeriver.GetBytes(16);
            var res = aes.EncryptCbc(bytes, keyDeriver.GetBytes(16));
            return res;
        }

        private static byte[] DecryptData(byte[] bytes, string encryptionPassword, string encryptionSalt)
        {
            var keyDeriver = new Rfc2898DeriveBytes(encryptionPassword, Encoding.UTF8.GetBytes(encryptionSalt));
            var aes = Aes.Create();
            aes.Key = keyDeriver.GetBytes(16);
            var res = aes.DecryptCbc(bytes, keyDeriver.GetBytes(16));
            return res;
        }
    }
}
