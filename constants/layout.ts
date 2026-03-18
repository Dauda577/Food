import { Platform } from "react-native";

// Floating tab bar dimensions
export const TAB_BAR_HEIGHT    = 64;
export const TAB_BAR_BOTTOM    = 20;  // distance from bottom edge
export const TAB_BAR_TOTAL     = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM;

// Screens inside tab navigator need this bottom padding
// so content doesn't hide behind the floating tab bar
export const SCREEN_PADDING_BOTTOM = TAB_BAR_TOTAL + 16;  // 100px

// Screens outside the tab navigator (product, checkout, etc.)
// just need safe area — no tab bar
export const MODAL_PADDING_BOTTOM = Platform.OS === "ios" ? 34 : 24;