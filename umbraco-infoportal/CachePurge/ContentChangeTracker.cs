using System.Collections.Concurrent;

namespace umbraco_infoportal.CachePurge;

// Bridges rename detection from CachePurgeOnSavedHandler to AffectedUrlResolver at publish
// time. Consume() removes the entry; a saved-but-never-published mark lingers harmlessly.
public interface IContentChangeTracker
{
    void MarkNameChanged(int contentId);
    bool ConsumeNameChanged(int contentId);
}

public class ContentChangeTracker : IContentChangeTracker
{
    private readonly ConcurrentDictionary<int, byte> _renamed = new();

    public void MarkNameChanged(int contentId) => _renamed[contentId] = 1;

    public bool ConsumeNameChanged(int contentId) => _renamed.TryRemove(contentId, out _);
}
