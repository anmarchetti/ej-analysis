namespace easyJet.Holidays.Api.Domain.Data.LivePrice
{
    public class NamedSearch
    {
        /// <summary>
        /// Id
        /// </summary>
        public string Id => $"{Name}({Language})";

        /// <summary>
        /// Id
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Language
        /// </summary>
        public string Language { get; set; }

        /// <summary>
        /// Adults count
        /// </summary>
        public int Adults { get; set; }

        /// <summary>
        /// Children count
        /// </summary>
        public int Children { get; set; }

        /// <summary>
        /// Infants count
        /// </summary>
        public int Infants { get; set; }

        /// <summary>
        /// Holiday duration
        /// </summary>
        public int Duration { get; set; }

        /// <summary>
        /// Child ages. should be specified as many values as count, specified inside <see cref="Children"/> field
        /// </summary>
        public IEnumerable<string> ChildAges { get; set; }

        /// <summary>
        /// Theme types codes
        /// </summary>
        public IEnumerable<string> ThemeTypesCodes { get; set; }

        public override bool Equals(object obj)
        {
            return obj is NamedSearch search && Id == search.Id;
        }
        public override int GetHashCode()
        {
            return Id.GetHashCode();
        }

        /// <summary>
        /// Returns copy of this object
        /// </summary>
        public NamedSearch Copy()
        {
            return new NamedSearch
            {
                Name = Name,
                Language = Language,
                Adults = Adults,
                Children = Children,
                Infants = Infants,
                Duration = Duration,
                ChildAges = ChildAges?.ToArray(),
                ThemeTypesCodes = ThemeTypesCodes?.ToArray(),
            };
        }
    }
}
