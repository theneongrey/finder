using Finder.Business.Auth.Api.Requests;
using Finder.Business.Auth.Api.Responses;
using Finder.Business.Auth.Services;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Asn1.Ocsp;

namespace Finder.Business.Auth.Api;

public static class AuthApi
{
    public static void WithAuthApi(this WebApplication app)
    {
        app.MapPost("/requestLoginMail", async ([FromBody] RequestLoginMailRequest request, LoginService loginService) =>
        {
            await loginService.RequestLoginMail(request.Email, request.RedirectUrl);
        });

        app.MapPost("/login", async ([FromBody] LoginRequest request, LoginService loginService) =>
        {
            var result = await loginService.Login(request.LoginToken);
            if (result.IsSuccess)
            {
                return Results.Ok(result.Payload);
            }
            
            return Results.Unauthorized();
        });
        
        app.MapGet("/who", async (PersonService personService) =>
        {
            var result = await personService.GetPerson();
            if (!result.IsSuccess)
            {
                return Results.NoContent();
            }

            return Results.Ok(new PersonResponse
            {
                Name = result.Payload!.Name
            });
        });
        
        app.MapPost("/name", async ([FromBody] SetNameRequest request, PersonService loginService) =>
        {
            var result = await loginService.SetName(request.Name);
            if (!result.IsSuccess)
            {
                return Results.NotFound();
            }

            return Results.Ok();
        }).RequireAuthorization();
        
        app.MapPost("/logout", async (LoginService loginService) =>
        {
            await loginService.Logout();
        });
    }
}