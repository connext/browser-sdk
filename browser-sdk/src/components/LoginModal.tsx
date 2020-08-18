import React, { useRef, useContext } from "react";


function LoginModal({magic, isLoggedIn, refreshLogin}) {
  const emailRef = useRef<HTMLInputElement>(null);

  async function loginUser(e) {
    e.preventDefault();
    if (!e.target.checkValidity() || !emailRef || !emailRef.current) {
      console.log("Invalid email!");
      return
    }
    const email = emailRef.current.value;
    await magic.auth.loginWithMagicLink({ email });
    await refreshLogin();
  }

  async function logoutUser() {
    await magic.user.logout();
    await refreshLogin();
  }

  return (
    <div className="flex-column">
      {isLoggedIn ?
        <>
          <h1>Login Successful!</h1>
          <button onClick={logoutUser}>Logout</button>
        </>:
        <>
          <form onSubmit={loginUser}>
            <h1>Please enter your email to login.</h1>
            <input
              required
              type="email"
              placeholder="Enter your email"
              ref={emailRef}
            />
            <button type="submit">Send me a login link!</button>
          </form>
        </>
      }
    </div>
  )
}

export default LoginModal;