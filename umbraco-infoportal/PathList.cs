public class PathList
{
    private List<string> paths;

    public PathList()
    {
        paths = [];
    }

    public bool AddPath(string path)
    {
        if (string.IsNullOrEmpty(path))
        {
            return false;
        }

        paths.Add(NormalizePath(path));
        return true;
    }

    public static string NormalizePath(string path)
    {
        if (!path.StartsWith("/"))
        {
            path = "/" + path;
        }

        if (path.EndsWith("/"))
        {
            path = path[..^1];
        }

        return path;
    }

    public string[] ToArray()
    {
        return [.. paths];
    }
}