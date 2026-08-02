function userCan(user, featureKey) {
  if (!user) {
    return false;
  }

  if (user.role?.is_super) {
    return true;
  }

  return Boolean(user.features?.includes(featureKey));
}

module.exports = {
  userCan,
};
