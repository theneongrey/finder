using MailKit.Security;

namespace Finder.Business.Auth.Setup;

public class SmtpOptions
{
    public required string Host { get; set; }
    public required int Port { get; set; }
    public required string User { get; set; }
    public required string Password { get; set; }

    /// <summary>
    /// TLS mode for the SMTP connection. <c>SslOnConnect</c> is implicit TLS (typically port 465);
    /// use <c>StartTls</c> for providers that upgrade a plain connection (typically port 587).
    /// </summary>
    public SecureSocketOptions SecureSocketOptions { get; set; } = SecureSocketOptions.SslOnConnect;

    /// <summary>Display name shown as the sender of outgoing mails.</summary>
    public string FromName { get; set; } = "Votean";
}
