export default function checkAdmin(context) {
  const user = context?.user;
  if (!user?.id) throw new Error('Unauthorized — token missing or invalid');
  if (!user.isAdmin) throw new Error('Forbidden — admin only');
  return user;
}
