using Finder.Business.Auth.Api.Requests;
using Finder.Business.Auth.Api.Responses;
using Finder.Business.Auth.Entities;
using Finder.Business.Auth.Services;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Asn1.Ocsp;

namespace Finder.Business.Auth.Api;

public static class AuthApi
{
    public static void WithAuthApi(this WebApplication app)
    {
        app.MapPost("/api/auth/requestLoginMail", async ([FromBody] RequestLoginMailRequest request, LoginService loginService) =>
        {
            var result = await loginService.RequestLoginMail(request.Email, request.RedirectUrl);
            return result.IsSuccess ? Results.Ok() : Results.Forbid();
        });

        app.MapPost("/api/auth/tokenLogin", async ([FromBody] TokenLoginRequest request, LoginService loginService) =>
        {
            var result = await loginService.LoginByToken(request.LoginToken);
            if (result.IsSuccess)
            {
                return Results.Ok(result.Payload);
            }
            
            return Results.Unauthorized();
        });
        
        app.MapPost("/api/auth/codeLogin", async ([FromBody] CodeLoginRequest request, LoginService loginService) =>
        {
            var result = await loginService.LoginByCode(request.Email, request.LoginCode);
            if (result.IsSuccess)
            {
                return Results.Ok(result.Payload);
            }
            
            return Results.Unauthorized();
        });
        
        app.MapGet("/api/auth/who", async (PersonService personService) =>
        {
            var result = await personService.GetUser();
            if (!result.IsSuccess)
            {
                return Results.Ok(new PersonResponse());
            }

            return Results.Ok(new PersonResponse
            {
                Name = result.Payload!.Name,
                Email = result.Payload!.Email,
                Role = Enum.GetName(result.Payload!.Role),
                IsAuthenticated = true
            });
        });
        
        app.MapPost("/api/auth/name", async ([FromBody] SetNameRequest request, PersonService loginService) =>
        {
            var result = await loginService.SetName(request.Name);
            if (!result.IsSuccess)
            {
                return Results.NotFound();
            }

            return Results.Ok(new PersonResponse
            {
                Name = result.Payload!.Name,
                Email = result.Payload!.Email,
                IsAuthenticated = true
            });
        }).RequireAuthorization();
        
        app.MapPost("/api/auth/logout", async (LoginService loginService) =>
        {
            await loginService.Logout();
        });
    }
}