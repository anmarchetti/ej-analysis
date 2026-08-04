using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class HotelThemeResponse
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="HotelThemeResponse"/> class.
        /// Constructor sets Themes property to constructor argument.
        /// </summary>
        /// <param name="themes">Collection of HotelThemeResponseItem objects.</param>
        public HotelThemeResponse(IEnumerable<HotelThemeResponseItem> themes)
        {
            Themes = themes ?? Enumerable.Empty<HotelThemeResponseItem>();
        }

        public IEnumerable<HotelThemeResponseItem> Themes { get; set; }
    }
}