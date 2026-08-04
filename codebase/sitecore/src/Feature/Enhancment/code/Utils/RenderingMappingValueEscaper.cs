namespace easyJet.Feature.SitecoreEnhancment.Utils
{
    /// <summary>
    ///     Utility class for escaping and unescaping values in rendering mapping field format.
    ///     Escapes only pipe (|) and colon (:) characters to avoid conflicts with field delimiters.
    /// </summary>
    public static class RenderingMappingValueEscaper
    {
        /// <summary>
        ///     Escapes pipe and colon characters in a value string.
        /// </summary>
        /// <param name="value">The value to escape.</param>
        /// <returns>The escaped value, or the original value if it's null or empty.</returns>
        public static string EscapeValue(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return value;
            }

            return value.Replace("|", "<PIPE>").Replace(":", "<COLON>");
        }

        /// <summary>
        ///     Unescapes placeholders back to pipe and colon characters.
        /// </summary>
        /// <param name="value">The value to unescape.</param>
        /// <returns>The unescaped value, or the original value if it's null or empty.</returns>
        public static string UnescapeValue(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return value;
            }

            return value.Replace("<PIPE>", "|").Replace("<COLON>", ":");
        }
    }
}
