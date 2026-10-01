/** The host of a URL without a leading `www.`, e.g. `sup-verleih-gardasee.it`. Falls back to
 *  the raw string when it can't be parsed. */
export function urlDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}
