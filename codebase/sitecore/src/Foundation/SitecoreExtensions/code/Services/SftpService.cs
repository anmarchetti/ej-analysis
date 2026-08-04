using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Models;
using Renci.SshNet;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public class SftpService : ISftpService
    {
        private readonly ICsvUtilsService csvUtilsService;
        private readonly ILogger logger;
        private readonly SftpConfig config;

        public SftpService(SftpConfig config, ICsvUtilsService csvUtilsService, ILogger logger)
        {
            this.config = config ?? throw new ArgumentNullException(nameof(config), "Sftp credentials can not be empty.");
            this.csvUtilsService = csvUtilsService;
            this.logger = logger;
        }

        /// <inheritdoc/>
        public List<T> GetLastUpdatedFileData<T>(FileParameters fileParameters)
            where T : class, new()
        {
            try
            {
                var fileArray = GetLastUpdatedFile(fileParameters.Directory, fileParameters.Filename);

                if (fileArray == null)
                {
                    return new List<T>();
                }

                using (Stream fileStream = new MemoryStream(fileArray))
                {
                    return csvUtilsService.ReadFromCsv<T>(fileStream, fileParameters);
                }
            }
            catch (Exception ex)
            {
                logger.Error(ex.Message, ex, this);
                return new List<T>();
            }
        }

        /// <summary>
        /// Get last updated file from sftp server.
        /// </summary>
        /// <param name="directory">Directory path.</param>
        /// <param name="filename">Filename.</param>
        /// <returns>Stream of the file.</returns>
        private byte[] GetLastUpdatedFile(string directory, string filename)
        {
            byte[] result = null;

            using (var client = new SftpClient(config.Host, config.Port, config.Login, config.Password))
            {
                client.Connect();
                if (client.IsConnected)
                {
                    Regex regex = new Regex(filename);

                    client.ChangeDirectory(directory);
                    var file = client
                        .ListDirectory(directory)
                        .Where(x => regex.IsMatch(x.Name))
                        .OrderByDescending(x => x.LastWriteTime)
                        .FirstOrDefault();

                    if (file != null)
                    {
                        result = client.ReadAllBytes(file.FullName);
                    }
                    else
                    {
                        logger.Warn($"Could not find a file {directory}/{filename} in sftp Server {config.Host}.", this);
                    }
                }
                else
                {
                    logger.Warn($"Could not connect to Sftp server {config.Host}.", this);
                }

                client.Disconnect();
            }

            return result;
        }
    }
}