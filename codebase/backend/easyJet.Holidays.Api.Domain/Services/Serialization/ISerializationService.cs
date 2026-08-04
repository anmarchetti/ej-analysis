namespace easyJet.Holidays.Api.Domain.Services.Serialization
{
    /// <summary>
    /// Serialization service
    /// </summary>
    public interface ISerializationService
    {
        /// <summary>
        /// Serializes object to byte array
        /// </summary>
        /// <typeparam name="T">Value type</typeparam>
        /// <param name="objectToSerialize">Value to serialize</param>
        /// <returns>Bytes array</returns>
        byte[] Serialize<T>(T objectToSerialize);

        /// <summary>
        /// Deserrializes yte arary to target object
        /// </summary>
        /// <typeparam name="T">Object type</typeparam>
        /// <param name="arrayToDeserialize">Bytes array</param>
        /// <returns>Object</returns>
        T Deserialize<T>(byte[] arrayToDeserialize);
    }
}
