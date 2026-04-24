using Azure.Identity;
using Azure.Storage.Blobs;
using Umbraco.Cms.Core.Composing;
using Umbraco.StorageProviders.AzureBlob.IO;

public class AzureBlobFileSystemComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
        => builder.AddAzureBlobMediaFileSystem(options =>
        {
            options.TryCreateBlobContainerClientUsingUri(uri =>
                new BlobContainerClient(uri, new DefaultAzureCredential()));
        })
        .AddAzureBlobImageSharpCache();
}