import React, { useState } from "react";
import { Magic } from "magic-sdk";


function LoginModal({magic, isLoggedIn, setIsLoggedIn}) {
  const [email, setEmail] = useState<string | undefined>(undefined);

  async function loginUser(e) {
    e.preventDefault();
    if (!e.target.checkValidity()) {
      console.log("Invalid email!");
      return
    }
    const idToken = await magic.auth.loginWithMagicLink({ email });
    console.log(idToken);
    setIsLoggedIn(true);
    console.log(isLoggedIn);
  }

  return (
    <div className="flex-column">
      {isLoggedIn ?
        <>
          <h1>Login Successful!</h1>
        </>:
        <>
          <form onSubmit={loginUser}>
            <h1>Please enter your email to login.</h1>
            <input
              required
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button type="submit">Send me a login link!</button>
          </form>
        </>
      }
    </div>
  )
}

export default LoginModal;