using System;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Foundation.HotelBeds.Exceptions
{
    [ExcludeFromCodeCoverage]
    public class HotelSyncException : Exception
    {
        public HotelSyncException()
        {
        }

        public HotelSyncException(string code, string name, string message, Exception ex)
            : base(message, ex)
        {
            Code = code;
            Name = name;
        }

        /// <summary>
        /// Gets or sets Hotel's code.
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Gets or sets Hotel's name.
        /// </summary>
        public string Name { get; set; }
    }
}