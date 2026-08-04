using System;
using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Utils
{
    public class TransliterationTests
    {
        [Theory]
        [MemberData(nameof(InvalidCharacterTestCases))]
        public static void ToLatin_ShouldTraslitareteOnlyNonEnglishCharaters_IfHasSpecialCharacter(string text, string expected)
        {
            var result = Transliteration.ToLatin(text);

            Assert.Equal(expected, result);
        }

        public static IEnumerable<object[]> InvalidCharacterTestCases()
        {
            yield return new object[]
            {
                "̇",
                "̇",
            };
            yield return new object[]
            {
                "̇-!&",
                "̇-!&"
            };
        }

        [Theory]
        [MemberData(nameof(SuccessTestCases))]
        public static void ToLatin_ShouldTranslatilate_IfTextIsValid(string text, string expected)
        {
            var result = Transliteration.ToLatin(text);

            Assert.Equal(expected, result);
        }

        [Theory]
        [InlineData("Escapades\u00A0à Londres", "Escapades a Londres")]
        public static void ToLatin_ShouldTrimSpaceCharater_IfTextHasSpaceCharaters(string text, string expected)
        {
            var result = Transliteration.ToLatin(text);

            Assert.Equal(expected, result);
        }

        public static IEnumerable<object[]> SuccessTestCases()
        {
            yield return new object[]
            {
                "ÁÀÂÄÃĂÅĀĄĆĈČĊÇĐĎÉÈÊËĚĖĒĘĔĜĞĠĢĦĤÍÌÎÏİĨĪĬĮĴĶŁĹĽĻĿŃŇÑŅØÓÒÔÖÕŐŌŎŔŖŘŚŜŞŠŦŤŢÚÙÛÜŨŬŰŮŪŲŴŶŹŽŻÝŸÞÆĲŒАБВГДЕЁЖЗИІЙКЛМНОПРСТУФХЦЧШЩЫЪЭЮЯѴҐЎѪƑЂЅΑΆΒΓΔΕΈΖΗΉΘΙΊΪΚΛΜΝΞΟΌΠΡΣΤΥΎΫΦΧΨΩΏ",
                "AAAAeAAAAAACCCCCDDEEEEEEEEEGGGGHHIIIIIIIIIJKLLLLLNNNNOeOOOOeOOOORRRSSSSTTTUUUUeUUUUUUWYZZZYYThAeIjOeABVGDEEZhZIIIKLMNOPRSTUFKhTsChShShchYIeEIuIaYGUUGDDzAAVGDEEZIIThIIIKLMNXOOPRSTYYYFChPsOO"
            };
            yield return new object[]
            {
                "áàâäãăåāąćĉčċçđďéèêëěėēęĕĝğġģħĥíìîïĩīĭįĵķłĺľļŀńňñņøóòôöõőōŏŕŗřśŝşšŧťţúùûüũŭűůūųŵŷźžżýÿþæĳœßабвгдеёжзиійклмнопрстуфхцчшщыъэюяѵґўѫƒђѕαάβγδεέζηήθιίϊκλμνξοόπρστυύϋφχψωώ",
                "aaaaeaaaaaacccccddeeeeeeeeegggghhiiiiiiiijklllllnnnnoeooooeoooorrrsssstttuuuueuuuuuuwyzzzyythaeijoessabvgdeezhziiiklmnoprstufkhtschshshchyieeiuiayguugddzaavgdeeziithiiiklmnxooprstyyyfchpsoo"
            };
            yield return new object[]
            {
                "i̇",
                "i"
            };
            yield return new object[]
            {
                "abc",
                "abc"
            };
            yield return new object[]
            {
                "ai̇bc",
                "aibc"
            };
            yield return new object[]
            {
                "ai'bc",
                "ai bc"
            };
        }
    }
}
