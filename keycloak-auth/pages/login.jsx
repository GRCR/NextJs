import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect } from 'react'

export default function Component() {
  const { data: session } = useSession()
  console.log("login Session: ", session);

  // useEffect(() => {
  //   if (session?.error === "RefreshAccessTokenError") {
  //     //     signIn() // Force sign in to hopefully resolve error
  //     signOut(); // Force sign out to hopefully resolve error
  //   }
  // }, [session]);

  if (session) {
    return (
      <>
        Signed in as {session.user.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}