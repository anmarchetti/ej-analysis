using Amazon.Lambda.Core;

namespace easyJet.Holidays.External.AWS.Logging
{
    public class LambdaConsoleLogger : ILambdaLogger
    {
        public void Log(string message)
        {
            Console.Write(message);
        }

        public void LogLine(string message)
        {
            Console.WriteLine(message);
        }
    }
}
