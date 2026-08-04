namespace easyJet.Holidays.Api.Domain.Interfaces.Serialize
{
    /// <summary> 
    /// Serializer with encoding decoding based on secret keys
    /// </summary>
    public interface ISecureSerializer
    {
        /// <summary>
        /// Deserizlize encoded string to object
        /// Should return null instead of throwing an exception, if deserialization fails
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="value"></param>
        /// <returns></returns>
        T Deserialize<T>(string value) where T : class;

        /// <summary>
        /// Serialize object to encoded string
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="value"></param>
        /// <returns></returns>
        string Serialize<T>(T value) where T : class;
    }
}
