using Infoportal.Cms.OperationalMessages.Services;
using Xunit;

namespace Infoportal.Cms.Tests.OperationalMessages;

public class AlertAreaValueTests
{
    private const string NewUdi = "umb://document/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    private const string FirstUdi = "umb://document/11111111111111111111111111111111";
    private const string SecondUdi = "umb://document/22222222222222222222222222222222";

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    public void Prepend_to_empty_value_returns_only_the_new_reference(string? stored)
    {
        Assert.Equal(NewUdi, AlertAreaValue.Prepend(stored, NewUdi));
    }

    [Fact]
    public void Prepend_puts_the_new_reference_first_and_keeps_existing_order()
    {
        string result = AlertAreaValue.Prepend($"{FirstUdi},{SecondUdi}", NewUdi);

        Assert.Equal($"{NewUdi},{FirstUdi},{SecondUdi}", result);
    }

    [Fact]
    public void Prepend_moves_an_existing_reference_to_the_top_instead_of_duplicating_it()
    {
        string result = AlertAreaValue.Prepend($"{FirstUdi},{NewUdi},{SecondUdi}", NewUdi);

        Assert.Equal($"{NewUdi},{FirstUdi},{SecondUdi}", result);
    }

    [Fact]
    public void Prepend_drops_blank_entries_and_whitespace()
    {
        string result = AlertAreaValue.Prepend($" {FirstUdi} ,, {SecondUdi},", NewUdi);

        Assert.Equal($"{NewUdi},{FirstUdi},{SecondUdi}", result);
    }
}
