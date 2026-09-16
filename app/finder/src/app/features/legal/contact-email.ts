/**
 * Assembles the imprint/privacy contact address at runtime from separate
 * fragments so the literal string never appears verbatim in the templates,
 * i18n JSON or a `mailto:` link. This is basic obfuscation against email
 * harvesters that scrape static markup; it is intentionally not a mailto link.
 */
export function getContactEmail(): string {
    const user = ['im', 'press', 'um'].join('');
    const domain = ['pixel-fusion', 'de'].join('.');
    const at = String.fromCharCode(64); // '@'
    return `${user}${at}${domain}`;
}
