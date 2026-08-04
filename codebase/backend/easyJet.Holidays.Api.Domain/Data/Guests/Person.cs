using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Guests
{
    public class Person : IValidatableObject
    {
        /// <summary>
        /// Guest age at checkout
        /// </summary>
        [DataMember(Name = "age")]
        public int Age { get; set; }

        /// <summary>
        /// Person's sex. Male/Female/Unknown. unknown is when for whatever reason it was not specified
        /// </summary>
        [DataMember(Name = "sex")]
        public Sex Sex { get; set; }

        /// <summary>
        /// Passenger type. Adult/Child/Infant
        /// </summary>
        [DataMember(Name = "type")]
        public PersonType Type { get; set; }

        /// <summary>
        /// Validate age:
        /// - adult: 16+
        /// - child: 2 to 15
        /// - infant under 2
        /// </summary>
        /// <param name="validationContext">additional information, such as the model instance created by model binding</param>
        /// <returns>validation results</returns>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // 0 is default value. Assume that implementation will use default age in this case
            if (Age == 0) yield break;

            if (Age < 0)
            {
                yield return new ValidationResult($"Age should be positive.");
                yield break;
            }

            if (Type == PersonType.Adult && Age < 16)
            {
                yield return new ValidationResult($"Adult age should be 16+.");
            }

            if (Type == PersonType.Child && (Age < 2 || Age > 15))
            {
                yield return new ValidationResult($"Child age should be 2 to 15.");
            }

            if (Type == PersonType.Infant && (Age >= 2 || Age <= 0))
            {
                yield return new ValidationResult($"Infant age should be under 2.");
            }
        }
    }

    /// <summary>
    /// Passenger's sex. Male/Female/Unknown. Unknown is when for whatever reason it was not specified
    /// </summary>
    public enum Sex
    {
        /// <summary>
        /// Unknown sex. being set when for whatever reason it was not specified explicitly
        /// </summary>
        [EnumMember(Value = "SEX_UNKNOWN")]
        Unknown,

        /// <summary>
        /// Male sex
        /// </summary>
        [EnumMember(Value = "SEX_MALE")]
        Male,

        /// <summary>
        /// Female sex
        /// </summary>
        [EnumMember(Value = "SEX_FEMALE")]
        Female
    }

    /// <summary>
    /// Passenger's type
    /// </summary>
    public enum PersonType
    {
        /// <summary>
        /// Adult. Set if person is 16+ years old
        /// </summary>
        [EnumMember(Value = "ADULT")]
        Adult,

        /// <summary>
        /// Child. Set if person is 2-15 years old
        /// </summary>
        [EnumMember(Value = "CHILD")]
        Child,

        /// <summary>
        /// Infant. Set if person is not born yet or is 0-2 years old
        /// </summary>
        [EnumMember(Value = "INFANT")]
        Infant
    }
}