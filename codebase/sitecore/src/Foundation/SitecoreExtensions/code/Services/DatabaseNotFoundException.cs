using System;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [ExcludeFromCodeCoverage]
    public class DatabaseNotFoundException : Exception
    {
        public DatabaseNotFoundException(DatabaseType type)
            : base($"Database of type {type} not found.")
        {
        }
    }
}