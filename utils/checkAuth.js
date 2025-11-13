export default function checkAuth(context) {
  const user = context?.user;
  if (!user?.id) {
    throw new Error('Unauthorized — token missing or invalid');
  }
  return user; 
}