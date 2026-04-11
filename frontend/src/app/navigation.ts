/**
 * Điều hướng sidebar — cấu hình tập trung tại {@link ./menu-config}.
 */
export type { AppNavItem, NavMenuKey } from "@/app/menu-config";
export {
  canSeeMenu,
  getFirstAccessibleSidebarPath,
  getNavAccessGate,
  getSidebarFlatItems,
  getSidebarSections,
  NAV_ACCESS_BY_PATH,
  NAV_MENU_DEFINITIONS,
} from "@/app/menu-config";

import type { MeResponse } from "@/types/auth";
import { getFirstAccessibleSidebarPath } from "@/app/menu-config";

/** @deprecated Dùng {@link getSidebarSections} trong layout. */
export function getFirstAccessibleAppPath(me: MeResponse): string | null {
  return getFirstAccessibleSidebarPath(me);
}
