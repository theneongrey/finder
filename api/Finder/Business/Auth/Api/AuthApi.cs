using Finder.Business.Auth.Api.Requests;
using Finder.Business.Auth.Services;
using Microsoft.AspNetCore.Mvc;

namespace Finder.Business.Auth.Api;

public static class AuthApi
{
    public static void WithAuthApi(this WebApplication app)
    {
        app.MapGet("/login", () =>{ });
        app.MapPost("/requestLoginMail", async ([FromBody] RequestLoginMailRequest requestLoginMailRequest, LoginService loginService) =>
        {
            await loginService.RequestLoginMail(requestLoginMailRequest.Email, requestLoginMailRequest.RedirectUrl);
        });
    }
}