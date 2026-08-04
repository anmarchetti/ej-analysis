namespace easyJet.Holidays.Tests.Domain.Extensions
{
    public static class StreamExtensions
    {
        public static Task<string> ReadAsync(this Stream stream)
        {
            using (var sr = new StreamReader(stream))
            {
                return sr.ReadToEndAsync();
            }
        }
    }
}
