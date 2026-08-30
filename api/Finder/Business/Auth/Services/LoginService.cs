using System.Security.Claims;
using System.Security.Cryptography;
using Finder.Business.Auth.Entities;
using Finder.Business.Auth.Setup;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Options;

namespace Finder.Business.Auth.Services;

public class LoginService
{
    private const int MaxRetries = 3;
    private readonly TimeSpan _loginTimeout = TimeSpan.FromHours(1);

    private readonly AppDbContext _dbContext;
    private readonly MailService _mailService;
    private readonly UserService _userService;
    private readonly SeedingService _seedingService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly LoginOptions _loginOptions;

    public LoginService(AppDbContext dbContext, MailService mailService, UserService userService, SeedingService seedingService, IHttpContextAccessor httpContextAccessor, IOptions<LoginOptions> loginOptions)
    {
        _dbContext = dbContext;
        _mailService = mailService;
        _userService = userService;
        _seedingService = seedingService;
        _httpContextAccessor = httpContextAccessor;
        _loginOptions = loginOptions.Value;
    }
    
    public async Task<Result<string?>> LoginByToken(string token)
    {
        var cleanToken = token.ToLower().Trim();
        
        var loginToken = await _dbContext.LoginTokens
            .Include(loginToken => loginToken.Person)
            .SingleOrDefaultAsync(t => t.Token == cleanToken);
        if (loginToken == null || IsTokenExpired(loginToken))
        {
            return Result<string?>.Fail(404);
        }

        return await SignIn(loginToken);
    }

    public async Task<Result<string?>> LoginByCode(string email, string code)
    {
        var cleanEmail = email.Trim().ToLower();
        var cleanCode = code.Trim().ToLower();
        
        var loginToken = await _dbContext.LoginTokens
            .Include(loginToken => loginToken.Person)
            .SingleOrDefaultAsync(t => t.Person.Email == cleanEmail);
        
        if (loginToken == null || loginToken.Code == null || IsTokenExpired(loginToken))
        {
            return Result<string?>.Fail(401);
        }
        
        if (loginToken.Code != cleanCode)
        {
            loginToken.Retries++;
            if (loginToken.Retries >= MaxRetries)
            {
                loginToken.Code = null;
            }
            
            await _dbContext.SaveChangesAsync();
            return Result<string?>.Fail(401);
        }

        return await SignIn(loginToken);
    }

    private bool IsTokenExpired(LoginToken loginToken)
    {
        return DateTime.UtcNow - loginToken.Created > _loginTimeout;
    }

    private async Task<Result<string?>> SignIn(LoginToken loginToken)
    {
        await _httpContextAccessor.HttpContext!.SignInAsync(new ClaimsPrincipal(
            new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, loginToken.Person.Id.ToString()),
                new Claim(ClaimTypes.Role, ((int)loginToken.Person.Role).ToString())
            ], CookieAuthenticationDefaults.AuthenticationScheme)),
            new AuthenticationProperties { IsPersistent = true });

        var redirectUrl = loginToken.RedirectUrl;

        var isFirstLogin = !loginToken.Person.HasLoggedIn;
        if (isFirstLogin)
        {
            await _seedingService.SeedNotificationSettingsForPerson(loginToken.Person.Id);
        }

        loginToken.Person.HasLoggedIn = true;
        _dbContext.Remove(loginToken);
        await _dbContext.SaveChangesAsync();

        return Result<string?>.Success(redirectUrl);
    }


    public async Task Logout()
    {
        await _httpContextAccessor.HttpContext!.SignOutAsync();
    }

    public async Task<Result> RequestLoginMail(string email, string? redirectUrl)
    {
        var cleanEmail = email.Trim().ToLower();

        var person = await _userService.GetOrCreatePersonByEmail(cleanEmail, true);
        if (!person.IsSuccess)
        {
            return Result.Fail(403);
        }
        
        var loginToken = await CreateLoginTokenForPerson(person.Payload!, redirectUrl);
        await _dbContext.SaveChangesAsync();
        await SendLoginMail(person.Payload!, loginToken);
        
        return Result.Success();
    }

    private async Task<LoginToken> CreateLoginTokenForPerson(Person person, string? redirectUrl)
    {
        var newTokenValue = _loginOptions.AuthToken ?? Guid.NewGuid().ToString("N").ToLower();

        var existingTokens = await _dbContext.LoginTokens
            .Where(t => t.Person.Id == person.Id)
            .ToListAsync();
        if (existingTokens.Count > 0)
        {
            _dbContext.LoginTokens.RemoveRange(existingTokens);
            await _dbContext.SaveChangesAsync();
        }

        await DeleteStaticDevTokenConflict(newTokenValue);

        var loginToken = new LoginToken
        {
            Id = Guid.NewGuid(),
            Person = person,
            RedirectUrl = redirectUrl,
            Token = newTokenValue,
            Code = GetRandomSixDigitCode(),
            Retries = 0,
        };
        _dbContext.LoginTokens.Add(loginToken);

        if (_loginOptions.AuthToken != null)
        {
            Console.Out.WriteLine("Code" + loginToken.Code);
        }

        return loginToken;
    }

    // In dev mode, AuthToken is a fixed static value shared across all users.
    // If another user holds a token with that value, inserting a new one would violate
    // the unique index. This method clears any such conflict before insertion.
    private async Task DeleteStaticDevTokenConflict(string tokenValue)
    {
        // the static auth token is set on dev mode only to test the login flow.
        if (_loginOptions.AuthToken == null)
        {
            return;
        }

        var conflict = await _dbContext.LoginTokens
            .Where(t => t.Token == tokenValue)
            .ToListAsync();
        if (conflict.Count > 0)
        {
            _dbContext.LoginTokens.RemoveRange(conflict);
            await _dbContext.SaveChangesAsync();
        }
    }

    private string GetRandomSixDigitCode()
    {
        var code = RandomNumberGenerator.GetInt32(0, 1000000);
        return code.ToString("D6");
    }

    private async Task SendLoginMail(Person person, LoginToken token)
    {
        await _mailService.SendLoginMail(person, token);
    }
}