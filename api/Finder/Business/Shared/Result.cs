namespace Finder.Business.Shared;

public class Result
{
    public int Code { get; init; }
    public bool IsSuccess { get; init; }

    private Result(int code, bool isSuccess)
    {
        Code = code;
        IsSuccess = isSuccess;
    }
    
    public static Result Success(int code = 200) => new(code, true);
    public static Result Fail(int code = 400) => new(code, false);
}

public class Result<T>
{
    public T? Payload { get; init; }
    public int Code { get; init; }
    public bool IsSuccess { get; init; }

    private Result(int code, T? payload, bool isSuccess)
    {
        Code = code;
        Payload = payload;
        IsSuccess = isSuccess;
    }

    public static Result<T> Success(T payload, int code = 200) => new(code, payload, true);
    public static Result<T> Fail(int code = 400) => new(code, default, false);
}