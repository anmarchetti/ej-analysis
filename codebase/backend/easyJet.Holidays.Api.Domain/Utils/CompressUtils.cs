using System.IO.Compression;

namespace easyJet.Holidays.Api.Domain.Utils
{
    public static class CompressUtils
    {
        public static MemoryStream ToGzipMemoryStream(byte[] file)
        {
            var output = new MemoryStream();

            using var gzipStream = new GZipStream(output, CompressionMode.Compress, true);
            using var input = new MemoryStream(file);

            input.CopyTo(gzipStream);

            return output;
        }

        public static string FromGzipMemoryStream(MemoryStream stream)
        {
            using var zipStream = new GZipStream(stream, CompressionMode.Decompress);
            using var reader = new StreamReader(zipStream);
            return reader.ReadToEnd();
        }

        /// <summary>
        /// decompression helper
        /// </summary>
        /// <param name="stream"></param>
        /// <returns></returns>
        public static byte[] FromGzip(Stream stream)
        {
            ArgumentNullException.ThrowIfNull(stream);

            stream.Seek(0, SeekOrigin.Begin);
            using var decompression = new GZipStream(stream, CompressionMode.Decompress);

            using var memoryStream = new MemoryStream();
            decompression.CopyTo(memoryStream);

            return memoryStream.ToArray();
        }
    }
}
