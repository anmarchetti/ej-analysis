using easyJet.Holidays.External.Domain.Models;

namespace easyJet.Holidays.Api.Domain.Interfaces.FileService
{
    /// <summary>
    /// AWS S3 file service
    /// </summary>
    public interface IS3FileService
    {
        /// <summary>
        /// Adds the json to bucket.
        /// </summary>
        /// <param name="bucketName">Name of the bucket.</param>
        /// <param name="fileKey">The file key.</param>
        /// <param name="file">File stream.</param>
        /// <returns></returns>
        Task UploadFile(string bucketName, string fileKey, byte[] file);

        /// <summary>
        /// Adds byte stream to bucket
        /// </summary>
        /// <param name="bucketName">Name of the bucket.</param>
        /// <param name="fileKey">The file key.</param>
        /// <param name="stream">File/memory/whatever else's steam.</param>
        Task UploadFile(string bucketName, string fileKey, Stream stream);

        /// <summary>
        /// Download file from AWS S3
        /// </summary>
        /// <param name="bucketName"></param>
        /// <param name="fileObjectKey"></param>
        /// <returns></returns>
        Task<byte[]> Download(string bucketName, string fileObjectKey);

        /// <summary>
        /// Get list of objects from S3 bucket
        /// </summary>
        /// <param name="bucketName"></param>
        /// <param name="folder"></param>
        /// <returns></returns>
        Task<IEnumerable<FileProperties>> ListAll(string bucketName, string folder = null);
    }
}