namespace easyJet.Foundation.Atcom.Models
{
    public class AtcomAccommodationMasterDataObject : DataObject
    {
        public AtcomAccommodationMasterDataObject(string code, string giataCode, string name, string phone, string email, string city, string address, string postalCode)
            : base(code, name)
        {
            GiataCode = giataCode;
            Phone = phone;
            Email = email;
            City = city;
            Address = address;
            PostalCode = postalCode;
        }

        /// <summary>
        /// Gets or sets GIATA code.
        /// </summary>
        public string GiataCode { get; set; }

        /// <summary>
        /// Gets or sets phone number.
        /// </summary>
        public string Phone { get; set; }

        /// <summary>
        /// Gets or sets email address.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Gets or sets city.
        /// </summary>
        public string City { get; set; }

        /// <summary>
        /// Gets or sets address.
        /// </summary>
        public string Address { get; set; }

        /// <summary>
        /// Gets or sets postal code.
        /// </summary>
        public string PostalCode { get; set; }
    }
}