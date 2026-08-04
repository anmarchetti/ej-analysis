namespace easyJet.Holidays.External.Domain.Models.Api.Payload
{
    public abstract class ApiPayload<T>
    {
        // Serialized object instance
        public T Body { get; set; }

        // Raw body string
        private string RawBody { get; set; }

        // body string hash value. Used for serialized body caching
        private int RawBodyHash { get; set; }

        protected abstract T DoDeserialize(string value);
        protected abstract string DoSerialize(T value);

        /// <summary>
        /// Deserialize string and save to Body property
        /// </summary>
        /// <param name="xmlString">String to deserialize</param>
        /// <returns>Boby property value</returns>
        public virtual void DeserializeBody(string value)
        {
            Body = DoDeserialize(value);
            RawBody = value;
            RawBodyHash = Body != null ? Body.GetHashCode() : 0;
        }

        /// <summary>
        /// Serializes Body. If value wasn't changed returns cached value
        /// </summary>
        public string SerializedBody
        {
            get
            {
                if (Body == null)
                {
                    return null;
                }
                if (RawBody == null || RawBodyHash != Body.GetHashCode())
                {
                    RawBody = DoSerialize(Body);
                    RawBodyHash = Body.GetHashCode();
                }

                return RawBody;
            }
            protected set
            {
                RawBody = value;
            }
        }
    }
}
