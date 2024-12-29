using Finder.Business.Auth.Entities;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Auth.Services;

public class LoginService
{
    private readonly AppDbContext _context;
    private readonly MailService _mailService;
    
    public LoginService(AppDbContext context, MailService mailService)
    {
        _context = context;
        _mailService = mailService;
    }

    public async Task<Person?> Login(string token)
    {
        return (await _context.LoginTokens
            .Where(t => t.Token == token)
            .Include(loginToken => loginToken.Person)
            .SingleOrDefaultAsync())
            ?.Person;
    }
    
    public async Task RequestLoginMail(string email, string? redirectUrl)
    {
        var person = await GetOrCreatePersonByEmail(email);
        var loginToken = await CreateLoginTokenForPerson(person, redirectUrl);
        await _context.SaveChangesAsync();
        await SendLoginMail(person, loginToken);
    }

    private async Task<Person> GetOrCreatePersonByEmail(string email)
    {
        var person = await _context.Persons.SingleOrDefaultAsync(p => p.Email == email);
        
        if (person is null)
        {
            person = new Person
            {
                Id = Guid.NewGuid(),
                Email = email,
            };
            _context.Persons.Add(person);
        }
        
        return person;
    }

    private async Task<LoginToken> CreateLoginTokenForPerson(Person person, string? redirectUrl)
    {
        var loginToken = await _context.LoginTokens.Where(t => t.Person.Id == person.Id).SingleOrDefaultAsync();

        if (loginToken is null)
        {
            loginToken = new LoginToken
            {
                Id = Guid.NewGuid(),
                Person = person,
            };
            _context.LoginTokens.Add(loginToken);
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