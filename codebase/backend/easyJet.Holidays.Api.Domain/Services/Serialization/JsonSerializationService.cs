using Utf8Json;

namespace easyJet.Holidays.Api.Domain.Services.Serialization
{
    /// <summary>
    /// Json serializer
    /// </summary>
    public class JsonSerializationService : ISerializationService
    {
        /// <inheritdoc />
        public byte[] Serialize<T>(T objectToSerialize)
        {
            return JsonSerializer.Serialize(objectToSerialize);
        }

        /// <inheritdoc />
        public T Deserialize<T>(byte[] arrayToDeserialize)
        {
            return JsonSerializer.Deserialize<T>(arrayToDeserialize);
        }
    }
}
