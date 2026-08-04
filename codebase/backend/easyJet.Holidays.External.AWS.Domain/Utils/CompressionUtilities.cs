using System.Diagnostics.CodeAnalysis;
using System.IO.Compression;
using System.Text;

namespace easyJet.Holidays.External.AWS.Domain.Utils;

/// <summary>
/// A utility class providing methods for compressing and decompressing data using GZip streams.
/// </summary>
[ExcludeFromCodeCoverage]
public static class CompressionUtilities
{
    /// <summary>
    /// Compresses a given string to a memory stream using the specified compression level.
    /// </summary>
    /// <param name="inputString">The string to be compressed.</param>
    /// <param name="compressionLevel">The level of compression to apply.</param>
    /// <returns>A memory stream containing the compressed data.</returns>
    public static MemoryStream CompressToMemoryStream(string inputString, CompressionLevel compressionLevel)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(inputString);

        var memoryStream = new MemoryStream();
        using (var gzipStream = new GZipStream(memoryStream, compressionLevel, true))
        {
            gzipStream.Write(bytes, 0, bytes.Length);
        }

        memoryStream.Position = 0;
        return memoryStream;
    }

    /// <summary>
    /// Decompresses a given compressed memory stream and returns the resulting decompressed string.
    /// </summary>
    /// <param name="compressedStream">The memory stream containing the compressed data to be decompressed.</param>
    /// <returns>A string representing the decompressed content of the provided memory stream.</returns>
    public static string DecompressMemoryStream(MemoryStream compressedStream)
    {
        using (compressedStream) {
            using (var gzipStream = new GZipStream(compressedStream, CompressionMode.Decompress))
            {
                using (var decompressedStream = new MemoryStream())
                {
                    gzipStream.CopyTo(decompressedStream);
                    byte[] decompressedBytes = decompressedStream.ToArray();

                    return Encoding.UTF8.GetString(decompressedBytes);
                }
            }
        }
    }

    /// <summary>
    /// Compresses a given string into a stream using GZip compression.
    /// </summary>
    /// <param name="input">The input string to be compressed.</param>
    /// <returns>A stream containing the compressed representation of the input string.</returns>
    public static Stream CompressString(string input)
    {
        byte[] inputBytes = Encoding.UTF8.GetBytes(input);
        var compressedStream = new MemoryStream();

        using var gzipStream = new GZipStream(compressedStream, CompressionLevel.Optimal, true);
        gzipStream.Write(inputBytes, 0, inputBytes.Length);

        compressedStream.Position = 0;
        return compressedStream;
    }

    /// <summary>
    /// Decompresses a GZip-compressed stream and converts its contents to a string.
    /// </summary>
    /// <param name="compressedStream">The input stream containing GZip-compressed data.</param>
    /// <returns>A decompressed string extracted from the compressed stream.</returns>
    public static string DecompressStreamToString(Stream compressedStream)
    {
        using var decompressedStream = new MemoryStream();
        using var gzipStream = new GZipStream(compressedStream, CompressionMode.Decompress);
      
        gzipStream.CopyTo(decompressedStream);
        decompressedStream.Seek(0, SeekOrigin.Begin);

        using var reader = new StreamReader(decompressedStream, Encoding.UTF8);
        return reader.ReadToEnd();
    }
}