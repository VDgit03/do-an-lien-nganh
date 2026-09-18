import dotenv from "dotenv";
import { findUserByEmail, createGoogleUser} from "../../models/authModel.js";

dotenv.config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;


// lấy user từ gg
const getGoogleUser = async (accessToken) => {

  // ktra access token
  const tokenResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!tokenResponse.ok) {
    throw new Error(
      "Google Access Token không hợp lệ hoặc đã hết hạn"
    );
  }

  const tokenData = await tokenResponse.json();

  // ktra client id
  if (tokenData.aud !== GOOGLE_CLIENT_ID) {
    throw new Error(
      "Google Client ID không khớp"
    );
  }


  // Lấy thông tin tài khoản Google
  const userResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!userResponse.ok) {
    throw new Error(
      "Không thể lấy thông tin tài khoản Google"
    );
  }

  const googleUser = await userResponse.json();

  if (!googleUser.email) {
    throw new Error(
      "Google không trả về email"
    );
  }

  if (googleUser.email_verified !== true) {
    throw new Error(
      "Email Google chưa được xác minh"
    );
  }

  return googleUser;
};

// gg login
export const loginWithGoogle = async (
  accessToken
) => {
  const googleUser = await getGoogleUser(accessToken);
  const email = googleUser.email;
  const first_name = googleUser.given_name || "";
  const last_name = googleUser.family_name || "";

  // tìm tài khoản 
  let user =
    await findUserByEmail(email);

  // tạo tài khoản Google
  if (!user) {
    user = await createGoogleUser({
        first_name,
        last_name,
        email
      });
  }
  return user;
};