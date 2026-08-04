using easyJet.Holidays.External.Domain.Extensions;
using System.IO.Compression;

namespace easyJet.Holidays.External.Domain.Utils
{
    public static class ZipUtils
    {
        /// <summary>
        ///  Decompress first file from zip archive
        /// </summary>
        /// <param name="zipArchive"></param>
        /// <returns></returns>
        public static async Task<byte[]> DecompressFirstFileAsync(byte[] zipArchive)
        {
            if (zipArchive == null || zipArchive.Length == 0) throw new ArgumentNullException(nameof(zipArchive));

            using (var ms = new MemoryStream(zipArchive))
            {
                using (var zipArchiveStream = new ZipArchive(ms, ZipArchiveMode.Read))
                {
                    //we expect only one file in zip archive
                    var zipEntry = zipArchiveStream.Entries.First();

                    using (var zipStream = zipEntry.Open())
                    {
                        return await zipStream.ReadAllBytesAsync();
                    }
                }
            }
        }

        /// <summary>
        /// Compress file
        /// </summary>
        /// <param name="fileName">The name of the file inside the archive</param>
        /// <param name="fileBytes"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentNullException"></exception>
        public static async Task<byte[]> CompressAsync(string fileName, byte[] fileBytes)
        {
            if (string.IsNullOrWhiteSpace(fileName)) throw new ArgumentNullException(nameof(fileName));
            if (fileBytes == null || fileBytes.Length == 0) throw new ArgumentNullException(nameof(fileBytes));

            using (var outStream = new MemoryStream())
            {
                using (var archive = new ZipArchive(outStream, ZipArchiveMode.Create))
                {
                    var fileInArchive = archive.CreateEntry(fileName, CompressionLevel.Optimal);

                    using (var entryStream = fileInArchive.Open())
                    {
                        using (var fileToCompressStream = new MemoryStream(fileBytes))
                        {
                            await fileToCompressStream.CopyToAsync(entryStream);
                        }
                    }
                }
                return outStream.ToArray();
            }
        }
    }
}