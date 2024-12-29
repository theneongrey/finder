using System.Security.Claims;
using Finder.Business.Auth.Entities;
using Finder.Business.Shared;
using Finder.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Finder.Business.Auth.Services;

public class LoginService
{
    private readonly AppDbContext _dbContext;
    private readonly MailService _mailService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public LoginService(AppDbContext dbContext, MailService mailService, IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _mailService = mailService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<string?>> Login(string token)
    {
        var loginToken = await _dbContext.LoginTokens
                .Include(loginToken => loginToken.Person)
                .SingleOrDefaultAsync(t => t.Token == token);
        if (loginToken == null)
        {
            return Result<string?>.Fail(404);
        }

        await _httpContextAccessor.HttpContext!.SignInAsync(new ClaimsPrincipal(
            new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, loginToken.Person.Id.ToString())
            ], CookieAuthenticationDefaults.AuthenticationScheme)));

        return Result<string?>.Success(loginToken.RedirectUrl);
    }

    public async Task Logout()
    {
        await _httpContextAccessor.HttpContext!.SignOutAsync();
    }

    public async Task RequestLoginMail(string email, string? redirectUrl)
    {
        var person = await GetOrCreatePersonByEmail(email);
        var loginToken = await CreateLoginTokenForPerson(person, redirectUrl);
        await _dbContext.SaveChangesAsync();
        await SendLoginMail(person, loginToken);
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
        loginToken.Token = Guid.NewGuid().ToString("N");

        return loginToken;
    }

    private async Task SendLoginMail(Person person, LoginToken token)
    {
        await _mailService.SendLoginMail(person, token);
    }
}