export class AuthorizationDomainService {
  hasPermission(user, requiredRole) {
    if (!user) {
      return false;
    }

    if (user.isAdmin) {
      return true;
    }

    return user.role === requiredRole;
  }

  hasAnyRole(user, roles) {
    if (!user) {
      return false;
    }

    if (user.isAdmin) {
      return true;
    }

    return roles.includes(user.role);
  }

  isActiveUser(user) {
    return user && user.canLogin();
  }
}

