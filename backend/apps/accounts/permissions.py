from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """Allows access only to Admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)

class IsStaffUserRole(permissions.BasePermission):
    """Allows access to Admin and Staff users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff_member)

class IsCustomerUserRole(permissions.BasePermission):
    """Allows access to Customer users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_customer)

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object (or customer link) to edit it.
    Staff and Admin have full read/write.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff_member:
            return True
        # If object is User
        if hasattr(obj, 'email') and obj == request.user:
            return True
        # If object has customer field linked to request.user
        if hasattr(obj, 'customer') and getattr(obj.customer, 'user', None) == request.user:
            return True
        # If object itself is Customer linked to request.user
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        return False
