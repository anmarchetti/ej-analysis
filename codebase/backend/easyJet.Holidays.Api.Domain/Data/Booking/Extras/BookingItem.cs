using easyJet.Holidays.Api.Domain.Data.Settings;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    [Serializable]
    [DataContract]
    [KnownType(typeof(TransferItem))]
    [KnownType(typeof(LateRoomCheckoutItem))]
    public class BookingItem : IPriceModel
    {
        [DataMember]
        public string Id { get; set; }

        [DataMember]
        public string Code { get; set; }

        [DataMember]
        public string Name { get; set; }

        [DataMember]
        public bool AutoInclude { get; set; }

        [DataMember]
        public DateTime? StartDate { get; set; }

        [DataMember]
        public string SetType { get; set; }

        [DataMember]
        public string TypeCode { get; set; }

        [DataMember]
        public string Prom { get; set; }

        [DataMember]
        public int Quantity { get; set; }

        [DataMember]
        public List<string> ServiceStates { get; set; }

        [DataMember]
        public List<string> Paxs { get; set; }

        [DataMember]
        public string RateRule { get; set; }

        [DataMember]
        public ItemMethod Method { get; set; }

        [DataMember]
        public MultiCentreMethod MCMethod { get; set; }

        [DataMember]
        public decimal Price { get; set; }

        public decimal PricePP { get; set; }

        [DataMember]
        public Currency Currency { get; set; }

        [DataMember]
        public int MinPax { get; set; }

        [DataMember]
        public int MaxPax { get; set; }

        [DataMember]
        public bool IsHidden { get; set; }

        public string ProductId { get; set; }

        [DataMember]
        public decimal? SmallSeSurcharge { get; set; }

        [IgnoreDataMember]
        public int SmallSeSurchargeQuantity { get; set; }

        [DataMember]
        public decimal? LargeSeSurcharge { get; set; }

        [IgnoreDataMember]
        public int LargeSeSurchargeQuantity { get; set; }

        public BookingItem() { }

        public BookingItem(BookingItem item)
        {
            Code = item.Code;
            Name = item.Name;
            AutoInclude = item.AutoInclude;
            StartDate = item.StartDate;
            SetType = item.SetType;
            TypeCode = item.TypeCode;
            Prom = item.Prom;
            Quantity = item.Quantity;
            ServiceStates = item.ServiceStates;
            Paxs = item.Paxs;
            RateRule = item.RateRule;
            Method = item.Method;
            MCMethod = item.MCMethod;
            Price = item.Price;
            Currency = item.Currency;
            MinPax = item.MinPax;
            MaxPax = item.MaxPax;
            Id = item.Id;
            ProductId = item.ProductId;
            SmallSeSurcharge = item.SmallSeSurcharge;
            SmallSeSurchargeQuantity = item.SmallSeSurchargeQuantity;
            LargeSeSurcharge = item.LargeSeSurcharge;
            LargeSeSurchargeQuantity = item.LargeSeSurchargeQuantity;
        }
    }

    public enum ItemMethod
    {
        [EnumMember(Value = "PI")]
        PI,

        [EnumMember(Value = "PP")]
        PP,
    }

    /// <summary>
    /// Used to state how Items to book
    /// </summary>
    public enum MultiCentreMethod
    {
        [EnumMember(Value = "MANY")]
        MANY,

        [EnumMember(Value = "PB")]
        PB,

        [EnumMember(Value = "PP")]
        PP,
    }
}
