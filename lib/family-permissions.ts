export type MemberPermissions = {
  manage?: boolean;
  createChild?: boolean;
  canCreateChild?: boolean;
  editChild?: boolean;
  canEditChild?: boolean;
  createCourse?: boolean;
  canCreateCourse?: boolean;
  book?: boolean;
  canManageBook?: boolean;
  commonsEvent?: boolean;
  canManageEvents?: boolean;
};

export type PermissionAction =
  | "createChild"
  | "editChild"
  | "createCourse"
  | "book"
  | "commonsEvent";

export const DEFAULT_MEMBER_PERMISSIONS: Required<
  Omit<
    MemberPermissions,
    "canCreateChild" | "canEditChild" | "canCreateCourse" | "canManageBook" | "canManageEvents"
  >
> = {
  manage: true,
  createChild: true,
  editChild: true,
  createCourse: true,
  book: true,
  commonsEvent: true,
};

export const hasPermission = (
  permissions: MemberPermissions | null | undefined,
  action: PermissionAction
): boolean => {
  if (!permissions) return false;

  // Master fallback: manage: true grants all
  if (permissions.manage === true) return true;

  switch (action) {
    case "createChild":
      return (
        permissions.createChild === true || permissions.canCreateChild === true
      );
    case "editChild":
      return (
        permissions.editChild === true || permissions.canEditChild === true
      );
    case "createCourse":
      return (
        permissions.createCourse === true || permissions.canCreateCourse === true
      );
    case "book":
      return (
        permissions.book === true || permissions.canManageBook === true
      );
    case "commonsEvent":
      return (
        permissions.commonsEvent === true || permissions.canManageEvents === true
      );
    default:
      return false;
  }
};
