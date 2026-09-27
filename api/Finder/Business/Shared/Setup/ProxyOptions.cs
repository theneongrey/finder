namespace Finder.Business.Shared.Setup;

public class ProxyOptions
{
    /// <summary>
    /// CIDR ranges whose X-Forwarded-* headers are trusted. Defaults to the private ranges,
    /// which cover the Docker network the reverse proxy (Traefik via Dokploy) reaches the API on.
    /// </summary>
    public string[] KnownNetworks { get; set; } = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8", "::1/128"];
}
