using System.Text;

namespace easyJet.Holidays.External.Domain.Extensions
{
    public static class StreamExtensions
    {
        /// <summary>
        /// Read all bytes from stream
        /// </summary>
        /// <param name="inputStream"></param>
        /// <returns></returns>
        public static async Task<byte[]> ReadAllBytesAsync(this Stream inputStream)
        {
            if (inputStream is MemoryStream stream)
                return stream.ToArray();

            using (var memoryStream = new MemoryStream())
            {
                await inputStream.CopyToAsync(memoryStream);
                return memoryStream.ToArray();
            }
        }

        /// <summary>
        /// Get stream from string
        /// </summary>
        /// <param name="s"></param>
        /// <param name="encoding"></param>
        /// <returns></returns>
        public static Stream GetStream(this string s, Encoding encoding = null)
        {
            var stream = new MemoryStream();
            var writer = encoding != null ? new StreamWriter(stream, encoding) : new StreamWriter(stream);
            writer.Write(s);
            writer.Flush();
            stream.Position = 0;
            return stream;
        }
    }
}