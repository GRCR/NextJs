// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// paths that require authentication or authorization

export async function middleware(request, response) {
    
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  //console.log("Middleware token: ", token);

  const res = NextResponse.next();

  if (token?.error === "RefreshAccessTokenError") {

  
    // const logOutUrl = new URL(`${process.env.KEYCLOAK_BASE_URL}/logout`);
    // //logOutUrl.searchParams.set("client_id", process.env.KEYCLOAK_ID);
    // logOutUrl.searchParams.set("id_token_hint", token.idToken);
    // // logOutUrl.searchParams.set("post_logout_redirect_uri", "www.google.com"); // Not working here
    // await fetch(logOutUrl);
  }

  //check not logged in
//   if (!token) {
//     const url = new URL(`/api/auth/signin`, request.url);
//     url.searchParams.set("callbackUrl", encodeURI(request.url));
//     return NextResponse.redirect(url);
//   }

  return res;
}
