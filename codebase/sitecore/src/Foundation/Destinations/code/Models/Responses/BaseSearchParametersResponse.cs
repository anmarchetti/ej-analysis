using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class BaseSearchParametersResponse
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="BaseSearchParametersResponse"/> class.
        /// </summary>
        /// <param name="searchParameters">Search parameters object.</param>
        public BaseSearchParametersResponse(BaseSearchParameters searchParameters)
        {
            Name = searchParameters.Name;
            NumberOfAdults = searchParameters.NumberOfAdults;
            NumberOfChildren = searchParameters.NumberOfChildren;
            ChildAges = searchParameters.ChildAges?.Select(x => x.Trim());
            NumberOfInfants = searchParameters.NumberOfInfants;
            DefaultDuration = searchParameters.DefaultDuration;
            ThemeTypesCodes = searchParameters.ThemeTypes?.Select(x => x.Code);
        }

        /// <summary>
        /// Gets name.
        /// </summary>
        public string Name { get; }

        /// <summary>
        /// Gets number of adults.
        /// </summary>
        public int NumberOfAdults { get; }

        /// <summary>
        /// Gets number of children.
        /// </summary>
        public int NumberOfChildren { get; }

        /// <summary>
        /// Gets number of infants.
        /// </summary>
        public int NumberOfInfants { get; }

        /// <summary>
        /// Gets default duration.
        /// </summary>
        public int DefaultDuration { get; }

        /// <summary>
        /// Gets child ages.
        /// </summary>
        public IEnumerable<string> ChildAges { get; }

        /// <summary>
        /// Gets theme types codes.
        /// </summary>
        public IEnumerable<string> ThemeTypesCodes { get; }
    }
}