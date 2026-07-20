export interface RailItem {
  /** Text shown in the expanded panel. */
  label: string;
  /** A full path (cross-page navigation) or a `#anchor` (in-document scroll). */
  href: string;
  /** Marks the current entry/section for the initial active state. */
  current?: boolean;
  /** Nesting level for sub-sections (0 = top level). Indents the panel item. */
  depth?: number;
}
