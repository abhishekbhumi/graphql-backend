import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';



export function generateToken(user) {
  const payload = {
    userId: user._id?.toString() ?? user.id,
    isAdmin: !!user.isAdmin
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}


export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
    } catch (err) { 
    return null;
    }
}