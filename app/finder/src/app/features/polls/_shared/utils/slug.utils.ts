/**
 * The stable id embedded at the end of a slug (`name-id`). Mirrors the backend
 * `SlugHelper.ExtractId`. Because the slug encodes the item's title, it changes when the title is
 * edited — but the trailing id does not, so identity comparisons must use this, not the full slug.
 */
export function extractSlugId(slug: string): string {
    const idx = slug.lastIndexOf('-');
    return idx === -1 ? slug : slug.slice(idx + 1);
}
