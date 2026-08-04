using Newtonsoft.Json;

namespace easyJet.Feature.PageContent.Models
{
    public class SitecoreField<T>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="SitecoreField{T}"/> class.
        /// This constructor needs for deserialization.
        /// </summary>
        public SitecoreField()
        {
        }

        public SitecoreField(T value)
        {
            Value = value;
        }

        /// <summary>
        /// Gets or sets generic value field.
        /// </summary>
        [JsonProperty(PropertyName = "value")]
        public T Value { get; set; }
    }
}