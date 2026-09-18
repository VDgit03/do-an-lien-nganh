import db from "../config/db.js";


// tìm user theo gmail
export const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  return rows[0];
};

// tạo user
export const createUser = async ({
  first_name,
  last_name,
  email,
  password
}) => {
  const [result] = await db.query(
    `
    INSERT INTO users
    (
      first_name,
      last_name,
      email,
      password
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      first_name,
      last_name,
      email,
      password
    ]
  );

  return result.insertId;
};

// tạo user gg
export const createGoogleUser = async ({
  first_name,
  last_name,
  email
}) => {
  const [result] = await db.query(
    `
    INSERT INTO users
    (
      first_name,
      last_name,
      email,
      password
    )
    VALUES (?, ?, ?, NULL)
    `,
    [
      first_name,
      last_name,
      email
    ]
  );

  return {
    id: result.insertId,
    first_name,
    last_name,
    email,
    password: null
  };
};

// tìm user theo id
export const findUserById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT
      first_name,
      last_name,
      password,
      last_change
    FROM users
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
};

// đổi pw
export const updatePassword = async (
  id,
  hashedPassword
) => {
  await db.query(
    `
    UPDATE users
    SET
      password = ?,
      last_change = NOW()
    WHERE id = ?
    `,
    [hashedPassword, id]
  );
};