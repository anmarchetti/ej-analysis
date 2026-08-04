using System.Diagnostics.CodeAnalysis;

namespace easyJet.Foundation.XConnect.ModelGenerator
{
    [ExcludeFromCodeCoverage]
    public class Program
    {
        public static void Main(string[] args)
        {
            ModelGenerator.Serialize();
        }
    }
}
