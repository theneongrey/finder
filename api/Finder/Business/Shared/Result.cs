namespace Finder.Business.Shared;

public class Result
{
    public string? ErrorMessasge { get; init; }
    public int Code { get; init; }
    public bool IsSuccess { get; init; }

    private Result(int code, bool isSuccess, string? errorMessasge)
    {
        Code = code;
        IsSuccess = isSuccess;
        ErrorMessasge = errorMessasge;
    }

    public static Result Success(int code = 200) => new(code, true, null);
    public static Result Fail(int code = 400, string? errorMessage = null) => new(code, false, errorMessage);
}

public class Result<T>
{
    public T? Payload { get; init; }
    public string? ErrorMessasge { get; init; }
    public int Code { get; init; }
    public bool IsSuccess { get; init; }

    private Result(int code, T? payload, bool isSuccess, string? errorMessasge)
    {
        Code = code;
        Payload = payload;
        IsSuccess = isSuccess;
        ErrorMessasge = errorMessasge;
    }

    public static Result<T> Success(T payload, int code = 200) => new(code, payload, true, null);
    public static Result<T> Fail(int code = 400, string? errorMessage = null) => new(code, default, false, errorMessage);
}