using Finder.Business.Auth.Entities;
using Finder.Business.Permission.Entities;
using Finder.Business.Project.Entities;
using Finder.Business.Shared.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finder.Database;

public class AppDbContext : DbContext
{
    public DbSet<Project> Projects { get; set; }
    public DbSet<Poll> Polls { get; set; }
    public DbSet<Option> Options { get; set; }
    public DbSet<OptionMeta> OptionMetas { get; set; }
    public DbSet<Vote> Votes { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Person> Persons { get; set; }
    public DbSet<LoginToken> LoginTokens { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<ProjectFavorite> ProjectFavorites { get; set; }
    
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(Project).Assembly);
    }
    
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var modifiedOrAddedEntities = ChangeTracker.Entries();

        foreach (var entry in modifiedOrAddedEntities)
        {
            if (entry.Entity is not BaseEntity baseEntity)
            {
                continue;
            }

            switch (entry.State)
            {
                case EntityState.Modified:
                    baseEntity.Edited = DateTime.UtcNow;
                    break;
                case EntityState.Added:
                    baseEntity.Created = DateTime.UtcNow;
                    baseEntity.Edited = DateTime.UtcNow;
                    break;
                case EntityState.Detached:
                case EntityState.Unchanged:
                case EntityState.Deleted:
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}