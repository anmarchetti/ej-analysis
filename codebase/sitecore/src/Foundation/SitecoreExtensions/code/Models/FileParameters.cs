using System;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Foundation.SitecoreExtensions.Models
{
    [ExcludeFromCodeCoverage]
    public class FileParameters
    {
        public string Directory { get; set; }

        public string Filename { get; set; }

        public string FileDataDelimiter { get; set; }

        public bool HasHeaderRecord { get; set; }

        public Type ClassMap { get; set; }
    }
}