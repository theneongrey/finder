import { OptionMeta } from '../models/poll-detail.model';

/** Link preview as held by the UI — only the url is guaranteed. */
export interface OptionMetaInput {
    url: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    siteName?: string;
}

/** Normalise a UI link preview into the request shape (the API expects every field set). */
export function toOptionMeta(meta?: OptionMetaInput): OptionMeta | undefined {
    return meta
        ? {
              url: meta.url,
              title: meta.title ?? '',
              description: meta.description ?? '',
              imageUrl: meta.imageUrl ?? '',
              siteName: meta.siteName ?? '',
          }
        : undefined;
}
