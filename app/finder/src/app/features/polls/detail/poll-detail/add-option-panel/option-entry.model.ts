/** A text option as edited in the add-option panel. */
export interface OptionEntry {
    id?: string;
    text: string;
    description: string;
    meta?: {
        url: string;
        title?: string;
        description?: string;
        imageUrl?: string;
        siteName?: string;
    };
}
