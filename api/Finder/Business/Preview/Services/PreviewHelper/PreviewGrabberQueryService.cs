using Finder.Business.Shared;
using Finder.Database;

namespace Finder.Business.Preview.Services.PreviewHelper;
    
public class PreviewGrabberQueryService
{
    private readonly AppDbContext _dbContext;

    public PreviewGrabberQueryService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public Result<Models.Preview> GetPreview(string htmlContent, Uri baseUrl)
    {
        return Result<Models.Preview>.Fail(500, "Not implemented");
    }
    
    public async Task RegisterQuery(string query)
    {
        
    }
}