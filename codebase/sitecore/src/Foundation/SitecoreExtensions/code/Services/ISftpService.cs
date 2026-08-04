using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Models;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public interface ISftpService
    {
        /// <summary>
        /// Get last updated file data models from sftp server.
        /// </summary>
        /// <typeparam name="T">T - response type.</typeparam>
        /// <param name="fileParameters">File parameters.</param>
        /// <returns>File data objects.</returns>
        List<T> GetLastUpdatedFileData<T>(FileParameters fileParameters)
            where T : class, new();
    }
}