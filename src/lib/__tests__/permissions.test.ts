import {
  getPermissions,
  hasPermission,
  canAccessTab,
  getAccessibleTabs,
  isAdminRole,
  getRoleDisplayInfo,
  tabPermissionMap,
  type UserRole,
  type Permission,
} from '@/lib/permissions';

describe('Permission System - User Role', () => {
  const userPerms = getPermissions('user');

  it('user should have no view permissions', () => {
    expect(userPerms.canViewOverview).toBe(false);
    expect(userPerms.canViewOrders).toBe(false);
    expect(userPerms.canViewUsers).toBe(false);
    expect(userPerms.canViewDeposit).toBe(false);
    expect(userPerms.canViewWithdraw).toBe(false);
    expect(userPerms.canViewKyc).toBe(false);
    expect(userPerms.canViewBanks).toBe(false);
    expect(userPerms.canViewExchangeRates).toBe(false);
    expect(userPerms.canViewProducts).toBe(false);
    expect(userPerms.canViewProviders).toBe(false);
    expect(userPerms.canViewPromoCodes).toBe(false);
    expect(userPerms.canViewBanners).toBe(false);
    expect(userPerms.canViewSettings).toBe(false);
  });

  it('user should have no action permissions', () => {
    expect(userPerms.canAdjustBalance).toBe(false);
    expect(userPerms.canBlockUsers).toBe(false);
    expect(userPerms.canManageRoles).toBe(false);
    expect(userPerms.canApproveDeposit).toBe(false);
    expect(userPerms.canApproveWithdraw).toBe(false);
    expect(userPerms.canManageProducts).toBe(false);
    expect(userPerms.canManageProviders).toBe(false);
    expect(userPerms.canManageBanks).toBe(false);
    expect(userPerms.canManageExchangeRates).toBe(false);
    expect(userPerms.canManagePromoCodes).toBe(false);
    expect(userPerms.canManageBanners).toBe(false);
    expect(userPerms.canSendBulkNotifications).toBe(false);
    expect(userPerms.canCompleteOrders).toBe(false);
    expect(userPerms.canCancelOrders).toBe(false);
    expect(userPerms.canApproveKyc).toBe(false);
  });

  it('user should not be an admin role', () => {
    expect(isAdminRole('user')).toBe(false);
  });

  it('user should have no accessible tabs', () => {
    expect(getAccessibleTabs('user')).toHaveLength(0);
  });
});

describe('Permission System - Super Admin Role', () => {
  const superAdminPerms = getPermissions('super_admin');

  it('super_admin should have all view permissions', () => {
    expect(superAdminPerms.canViewOverview).toBe(true);
    expect(superAdminPerms.canViewOrders).toBe(true);
    expect(superAdminPerms.canViewUsers).toBe(true);
    expect(superAdminPerms.canViewDeposit).toBe(true);
    expect(superAdminPerms.canViewWithdraw).toBe(true);
    expect(superAdminPerms.canViewKyc).toBe(true);
    expect(superAdminPerms.canViewBanks).toBe(true);
    expect(superAdminPerms.canViewExchangeRates).toBe(true);
    expect(superAdminPerms.canViewProducts).toBe(true);
    expect(superAdminPerms.canViewProviders).toBe(true);
    expect(superAdminPerms.canViewPromoCodes).toBe(true);
    expect(superAdminPerms.canViewBanners).toBe(true);
    expect(superAdminPerms.canViewSettings).toBe(true);
  });

  it('super_admin should have all action permissions', () => {
    expect(superAdminPerms.canAdjustBalance).toBe(true);
    expect(superAdminPerms.canBlockUsers).toBe(true);
    expect(superAdminPerms.canManageRoles).toBe(true);
    expect(superAdminPerms.canApproveDeposit).toBe(true);
    expect(superAdminPerms.canApproveWithdraw).toBe(true);
    expect(superAdminPerms.canManageProducts).toBe(true);
    expect(superAdminPerms.canManageProviders).toBe(true);
    expect(superAdminPerms.canManageBanks).toBe(true);
    expect(superAdminPerms.canManageExchangeRates).toBe(true);
    expect(superAdminPerms.canManagePromoCodes).toBe(true);
    expect(superAdminPerms.canManageBanners).toBe(true);
    expect(superAdminPerms.canSendBulkNotifications).toBe(true);
    expect(superAdminPerms.canCompleteOrders).toBe(true);
    expect(superAdminPerms.canCancelOrders).toBe(true);
    expect(superAdminPerms.canApproveKyc).toBe(true);
  });

  it('super_admin should be an admin role', () => {
    expect(isAdminRole('super_admin')).toBe(true);
  });

  it('super_admin should have access to all tabs', () => {
    expect(getAccessibleTabs('super_admin')).toHaveLength(Object.keys(tabPermissionMap).length);
  });
});

describe('Permission System - Admin Role', () => {
  const adminPerms = getPermissions('admin');

  it('admin should NOT have canViewSettings', () => {
    expect(adminPerms.canViewSettings).toBe(false);
  });

  it('admin should NOT have canManageRoles', () => {
    expect(adminPerms.canManageRoles).toBe(false);
  });

  it('admin should have all other view permissions', () => {
    expect(adminPerms.canViewOverview).toBe(true);
    expect(adminPerms.canViewOrders).toBe(true);
    expect(adminPerms.canViewUsers).toBe(true);
    expect(adminPerms.canViewDeposit).toBe(true);
    expect(adminPerms.canViewWithdraw).toBe(true);
    expect(adminPerms.canViewKyc).toBe(true);
    expect(adminPerms.canViewBanks).toBe(true);
    expect(adminPerms.canViewExchangeRates).toBe(true);
    expect(adminPerms.canViewProducts).toBe(true);
    expect(adminPerms.canViewProviders).toBe(true);
    expect(adminPerms.canViewPromoCodes).toBe(true);
    expect(adminPerms.canViewBanners).toBe(true);
  });

  it('admin should have most action permissions', () => {
    expect(adminPerms.canAdjustBalance).toBe(true);
    expect(adminPerms.canBlockUsers).toBe(true);
    expect(adminPerms.canApproveDeposit).toBe(true);
    expect(adminPerms.canApproveWithdraw).toBe(true);
    expect(adminPerms.canCompleteOrders).toBe(true);
    expect(adminPerms.canCancelOrders).toBe(true);
  });

  it('admin should be an admin role', () => {
    expect(isAdminRole('admin')).toBe(true);
  });
});

describe('Permission System - Moderator Role', () => {
  const modPerms = getPermissions('moderator');

  it('moderator should have limited view permissions', () => {
    expect(modPerms.canViewOverview).toBe(true);
    expect(modPerms.canViewOrders).toBe(true);
    expect(modPerms.canViewUsers).toBe(true);
    expect(modPerms.canViewDeposit).toBe(true);
    expect(modPerms.canViewWithdraw).toBe(true);
    expect(modPerms.canViewKyc).toBe(true);
    expect(modPerms.canViewBanks).toBe(false);
    expect(modPerms.canViewExchangeRates).toBe(false);
    expect(modPerms.canViewProducts).toBe(false);
    expect(modPerms.canViewProviders).toBe(false);
    expect(modPerms.canViewPromoCodes).toBe(false);
    expect(modPerms.canViewBanners).toBe(false);
    expect(modPerms.canViewSettings).toBe(false);
  });

  it('moderator should NOT be able to adjust balance or block users', () => {
    expect(modPerms.canAdjustBalance).toBe(false);
    expect(modPerms.canBlockUsers).toBe(false);
    expect(modPerms.canManageRoles).toBe(false);
  });

  it('moderator should be able to approve deposits/withdrawals and complete orders', () => {
    expect(modPerms.canApproveDeposit).toBe(true);
    expect(modPerms.canApproveWithdraw).toBe(true);
    expect(modPerms.canCompleteOrders).toBe(true);
    expect(modPerms.canCancelOrders).toBe(true);
    expect(modPerms.canApproveKyc).toBe(true);
  });

  it('moderator should be an admin role', () => {
    expect(isAdminRole('moderator')).toBe(true);
  });
});

describe('hasPermission', () => {
  it('should return true when role has the permission', () => {
    expect(hasPermission('super_admin', 'canViewOverview')).toBe(true);
    expect(hasPermission('admin', 'canViewOverview')).toBe(true);
  });

  it('should return false when role does not have the permission', () => {
    expect(hasPermission('user', 'canViewOverview')).toBe(false);
    expect(hasPermission('moderator', 'canManageBanks')).toBe(false);
  });

  it('should return false for unknown role', () => {
    expect(hasPermission('unknown' as UserRole, 'canViewOverview')).toBe(false);
  });
});

describe('canAccessTab', () => {
  it('should return true for super_admin on any tab', () => {
    Object.keys(tabPermissionMap).forEach(tabId => {
      expect(canAccessTab('super_admin', tabId)).toBe(true);
    });
  });

  it('should return false for user on any tab', () => {
    Object.keys(tabPermissionMap).forEach(tabId => {
      expect(canAccessTab('user', tabId)).toBe(false);
    });
  });

  it('should return false for unknown tab', () => {
    expect(canAccessTab('super_admin', 'nonexistent')).toBe(false);
  });

  it('admin should NOT access settings tab', () => {
    expect(canAccessTab('admin', 'settings')).toBe(false);
  });

  it('admin should access overview tab', () => {
    expect(canAccessTab('admin', 'overview')).toBe(true);
  });
});

describe('getRoleDisplayInfo', () => {
  it('should return correct info for super_admin', () => {
    const info = getRoleDisplayInfo('super_admin');
    expect(info.label).toBe('مدير أعلى');
    expect(info.color).toBeTruthy();
    expect(info.description).toBeTruthy();
  });

  it('should return correct info for admin', () => {
    const info = getRoleDisplayInfo('admin');
    expect(info.label).toBe('مدير');
  });

  it('should return correct info for moderator', () => {
    const info = getRoleDisplayInfo('moderator');
    expect(info.label).toBe('مشرف');
  });

  it('should return default for user', () => {
    const info = getRoleDisplayInfo('user');
    expect(info.label).toBe('مستخدم');
  });
});

describe('Permission hierarchy', () => {
  it('super_admin should have more permissions than admin', () => {
    const saPerms = getPermissions('super_admin');
    const aPerms = getPermissions('admin');
    const saTrue = Object.values(saPerms).filter(Boolean).length;
    const aTrue = Object.values(aPerms).filter(Boolean).length;
    expect(saTrue).toBeGreaterThanOrEqual(aTrue);
  });

  it('admin should have more permissions than moderator', () => {
    const aPerms = getPermissions('admin');
    const mPerms = getPermissions('moderator');
    const aTrue = Object.values(aPerms).filter(Boolean).length;
    const mTrue = Object.values(mPerms).filter(Boolean).length;
    expect(aTrue).toBeGreaterThan(mTrue);
  });

  it('moderator should have more permissions than user', () => {
    const mPerms = getPermissions('moderator');
    const uPerms = getPermissions('user');
    const mTrue = Object.values(mPerms).filter(Boolean).length;
    const uTrue = Object.values(uPerms).filter(Boolean).length;
    expect(mTrue).toBeGreaterThan(uTrue);
  });
});
