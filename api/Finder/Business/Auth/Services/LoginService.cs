using System.Security.Claims;
using System.Security.Cryptography;
using Finder.Business.Auth.Entities;
using Finder.Business.Shared;
using Finder.Database;
using Finder.Options;
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
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly LoginOptions _loginOptions;

    public LoginService(AppDbContext dbContext, MailService mailService, IHttpContextAccessor httpContextAccessor, IOptions<LoginOptions> loginOptions)
    {
        _dbContext = dbContext;
        _mailService = mailService;
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
        return DateTime.UtcNow - loginToken.Edited > _loginTimeout;
    }

    private async Task<Result<string?>> SignIn(LoginToken loginToken)
    {
        await _httpContextAccessor.HttpContext!.SignInAsync(new ClaimsPrincipal(
            new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, loginToken.Person.Id.ToString())
            ], CookieAuthenticationDefaults.AuthenticationScheme)));
        
        loginToken.Person.HasLoggedIn = true;
        loginToken.Token = null;
        loginToken.Code = null;
        await _dbContext.SaveChangesAsync();

        return Result<string?>.Success(loginToken.RedirectUrl);
    }


    public async Task Logout()
    {
        await _httpContextAccessor.HttpContext!.SignOutAsync();
    }

    public async Task<Result> RequestLoginMail(string email, string? redirectUrl)
    {
        var cleanEmail = email.Trim().ToLower();
        
        if (_loginOptions.AllowListOnly && !_dbContext.AllowedEmails.Any(entry => entry.Email == cleanEmail))
        {
            return Result.Fail(403);
        }
        
        var person = await GetOrCreatePersonByEmail(cleanEmail);
        var loginToken = await CreateLoginTokenForPerson(person, redirectUrl);
        await _dbContext.SaveChangesAsync();
        await SendLoginMail(person, loginToken);
        
        return Result.Success();
    }

    private async Task<Person> GetOrCreatePersonByEmail(string email)
    {
        var person = await _dbContext.Persons.SingleOrDefaultAsync(p => p.Email == email);

        if (person is null)
        {
            person = new Person
            {
                Id = Guid.NewGuid(),
                Email = email,
            };
            _dbContext.Persons.Add(person);
        }

        return person;
    }

    private async Task<LoginToken> CreateLoginTokenForPerson(Person person, string? redirectUrl)
    {
        var loginToken = await _dbContext.LoginTokens.SingleOrDefaultAsync(t => t.Person.Id == person.Id);

        if (loginToken is null)
        {
            loginToken = new LoginToken
            {
                Id = Guid.NewGuid(),
                Person = person,
            };
            _dbContext.LoginTokens.Add(loginToken);
        }

        loginToken.RedirectUrl = redirectUrl;
        loginToken.Token = _loginOptions.AuthToken ?? Guid.NewGuid().ToString("N").ToLower();
        loginToken.Code = GetRandomSixDigitCode();
        loginToken.Retries = 0;

        return loginToken;
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