import React, { useRef } from "react";

function LoginModal({ isLoggedIn, loginTarget }) {
  const emailRef = useRef<HTMLInputElement>(null);

  async function loginUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!e.currentTarget.checkValidity() || !emailRef || !emailRef.current) {
      console.log("Invalid email!");
      return;
    }
    const email = emailRef.current.value;
    loginTarget.dispatchEvent(new CustomEvent("login", {detail: email}));
  }

  return (
    <div className="flex-column">
      {isLoggedIn ?
        <>
          <h3>Login Successful!</h3>
        </> :
        <>
          <form onSubmit={loginUser}>
            <h3>Please enter your email to login.</h3>
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
  );
}

export default LoginModal;