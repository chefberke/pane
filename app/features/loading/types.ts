/** A single token in a tip — either plain text or a keyboard-key pill. */
export type TipSegment = string | { readonly kbd: string };

/** A tip is an ordered sequence of segments rendered inline. */
export type Tip = readonly TipSegment[];
