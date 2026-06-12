using Finder.Business.Auth.Api.Requests;
using Finder.Business.Auth.Services;
using Finder.Business.Shared.Services;
using Finder.Business.User.Api.Responses;
using Microsoft.AspNetCore.Mvc;

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
        
        app.MapGet("/api/auth/who", async (UserService userService) =>
        {
            var result = await userService.GetUser();
            if (!result.IsSuccess)
            {
                return Results.Ok(new PersonResponse());
            }

            return Results.Ok(result.Payload!.ToPersonResponse(true));
        });

        app.MapPost("/api/auth/logout", async (LoginService loginService) =>
        {
            await loginService.Logout();
        });
    }
}