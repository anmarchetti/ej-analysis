namespace easyJet.Holidays.External.Verint
{
    internal static class Utils
    {
        public static string ReplaceClientId(string url, string clientId)
        {
            return url.Replace("{clientId}", clientId);
        }

        public static string ReplaceCaseId(string url, string caseId)
        {
            return url.Replace("{caseId}", caseId);
        }
    }
}
