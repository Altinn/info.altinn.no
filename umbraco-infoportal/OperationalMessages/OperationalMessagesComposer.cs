using Umbraco.Cms.Core.Composing;
using Infoportal.Cms.OperationalMessages.Services;

namespace Infoportal.Cms.OperationalMessages;

public class OperationalMessagesComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddScoped<OperationalMessagePublisher>();
    }
}
