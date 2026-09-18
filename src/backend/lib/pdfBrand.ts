import { rgb } from "pdf-lib";

// Shared by every PDF this app generates (membership card, payment
// invoice) so they read as one consistent document family instead of each
// hand-rolling its own copy of the same brand colors and risking drift.
export const PDF_INK = rgb(0.078, 0.071, 0.067); // #141311, the real site's background
export const PDF_PANEL = rgb(0.129, 0.122, 0.114); // #211f1d, surface-container
export const PDF_ACCENT = rgb(1, 0.353, 0.122); // #ff5a1f, primary-container
export const PDF_WHITE = rgb(1, 1, 1);
export const PDF_MUTED = rgb(0.671, 0.537, 0.498); // #ab897f, outline
export const PDF_DIVIDER = rgb(0.212, 0.204, 0.196); // #363432, surface-variant
