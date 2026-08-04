using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Configuration settings required to connect to a Windows share.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class WindowsShareSettings
    {
        /// <summary>
        /// Gets or sets the server IP address or hostname of the Windows share.
        /// </summary>
        public string ServerIp { get; set; }

        /// <summary>
        /// Gets or sets the folder path within the share where operations are performed.
        /// </summary>
        public string FolderPath { get; set; }

        /// <summary>
        /// Gets or sets the username for authenticating with the Windows share.
        /// </summary>
        public string UserLogin { get; set; }

        /// <summary>
        /// Gets or sets the password for authenticating with the Windows share.
        /// </summary>
        public string UserPassword { get; set; }

        /// <summary>
        /// Gets or sets the domain for the authentication credentials.
        /// </summary>
        public string Domain { get; set; }

        /// <summary>
        /// Gets or sets the name of the share to connect to on the Windows server.
        /// </summary>
        public string ShareName { get; set; }
    }
}