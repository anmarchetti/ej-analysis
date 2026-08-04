namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Services;

/// <summary>
/// Defines methods for unzipping files in byte array format.
/// </summary>
public interface IUnzipService
{
    /// <summary>
    /// Unzips a zip file from a byte array and returns the content of the single file inside the zip as a byte array.
    /// </summary>
    /// <param name="zipFileBytes">The byte array representing the zip file.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the byte array of the unzipped file content.</returns>
    Task<byte[]> UnzipSingleFileToByteArray(byte[] zipFileBytes);
}