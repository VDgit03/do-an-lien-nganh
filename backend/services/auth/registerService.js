import bcrypt from "bcrypt";
import {findUserByEmail, createUser} from "../../models/authModel.js";

export const registerService = async ({
  first_name,
  last_name,
  email,
  password,
}) => {

  // check email
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("Email đã tồn tại");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // create user
  const result = await createUser({
    first_name,
    last_name,
    email,
    password: hashedPassword
  });
  return {
    id: result.insertId,
    first_name,
    last_name,
    email
  };
};