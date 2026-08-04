using System;

namespace easyJet.Foundation.AmazonS3.Exceptions
{
    /// <summary>
    /// Image Not Deleted Exception.
    /// </summary>
    public class ImageNotDeletedException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ImageNotDeletedException"/> class.
        /// </summary>
        /// <param name="message">Error message.</param>
        public ImageNotDeletedException(string message)
            : base(message)
        {
        }
    }
}