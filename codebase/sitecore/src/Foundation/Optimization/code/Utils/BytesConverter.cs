namespace easyJet.Foundation.Optimization.Utils
{
    public static class BytesConverter
    {
        /// <summary>
        /// Converts the size in bytes to kilobytes.
        /// </summary>
        /// <param name="bytes">The size in Bytes.</param>
        /// <returns>The size in kilobytes.</returns>
        public static double ConvertToKilobytes(long bytes)
        {
            return (double)bytes / 1024;
        }
    }
}