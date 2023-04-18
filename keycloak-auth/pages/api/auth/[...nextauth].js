import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { redirect } from "next/navigation";

const signOutCustom = async (token) => {
  console.log("signout: ", token);
  const logOutUrl = new URL(`${process.env.KEYCLOAK_BASE_URL}/logout`);
  //logOutUrl.searchParams.set("client_id", process.env.KEYCLOAK_ID);
  logOutUrl.searchParams.set("id_token_hint", token.idToken);
  // logOutUrl.searchParams.set("post_logout_redirect_uri", "www.google.com"); // Not working here
  await fetch(logOutUrl);
};

const refreshAccessToken = async (token) => {
  console.log("Refresh token requested: ", token);
  try {
    if (Date.now() > token.refreshTokenExpired) throw Error;
    const details = {
      client_id: process.env.KEYCLOAK_ID,
      client_secret: process.env.KEYCLOAK_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    };
    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    console.log("formBody: ", formBody);
    const url = `${process.env.KEYCLOAK_BASE_URL}/token`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: formBody,
    });
    const refreshedTokens = await response.json();

    console.log("Refresh token Response: ", refreshedTokens);

    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      idToken: refreshedTokens.id_token,
      accessTokenExpired: Date.now() + (refreshedTokens.expires_in - 15) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      refreshTokenExpired:
        Date.now() + (refreshedTokens.refresh_expires_in - 15) * 1000,
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
};

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID,
      clientSecret: process.env.KEYCLOAK_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
    // ...add more providers here
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      // console.log("user: ", user);
      // console.log("token: ", token);
      // console.log("account: ", account);

      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.accessTokenExpired = (account.expires_at - 15) * 1000;
        token.refreshTokenExpired =
          Date.now() + (account.refresh_expires_in - 15) * 1000;
        token.user = user;
        console.log("Returned token: ", token);
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpired) {
        console.log("Return exsiting token: ", token);
        return token;
      }
      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user;
        session.error = token.error;
        session.accessToken = token.accessToken;
      }
      if (session?.error === "RefreshAccessTokenError") {
        signOutCustom(token);
        return null;
      }
      return session;
    },
  },
  events: {
    async signOut({ session, token }) {
      signOutCustom(token);
    },
  },
};

export default NextAuth(authOptions);
