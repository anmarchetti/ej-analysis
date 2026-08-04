using System.Globalization;
using System.IO;
using CsvHelper;
using easyJet.Feature.Redirects.Models;
using FluentAssertions;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Models
{
    public class RedirectRuleCsvMapTests
    {
        [Fact]
        public void CsvMap_ShouldWriteExpectedHeaders()
        {
            using (var writer = new StringWriter())
            {
                var config = new CsvHelper.Configuration.Configuration(CultureInfo.InvariantCulture)
                {
                    HasHeaderRecord = true,
                    Delimiter = ","
                };
                using (var csvWriter = new CsvWriter(writer, config))
                {
                    csvWriter.Configuration.RegisterClassMap<RedirectRuleCsvMap>();
                    csvWriter.WriteRecords(new[]
                    {
                        new RedirectRuleCsvRow
                        {
                            FromUrl = "/from",
                            ToUrl = "/to",
                            RedirectType = "301"
                        }
                    });
                }

                var output = writer.ToString();
                output.Should().Contain("From URL");
                output.Should().Contain("To URL");
                output.Should().Contain("Redirect type 301 or 302");
            }
        }
    }
}
