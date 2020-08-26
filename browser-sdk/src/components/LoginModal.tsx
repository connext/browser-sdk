import React, { useState, useEffect } from "react";

function LoginModal({ sdkInstance, onLoginComplete }) {
  const [email, setEmail] = useState("");
  const [loginStage, setLoginStage] = useState("");

  useEffect(() => {
    (async () => {
      const isAlreadyLoggedIn = await sdkInstance.magic.user.isLoggedIn();
      if (isAlreadyLoggedIn) {
        setLoginStage("initializing_connext");
        await sdkInstance.authenticateWithMagic(); // TODO: handle errors
        setLoginStage("success");
        onLoginComplete(false); // already logged in automatically
        sdkInstance.checkDepositSubscription();
      } else {
        setLoginStage("choose_user");
      }
    })();
  }, []);

  const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      console.error("Invalid email!");
      return;
    }

    try {
      setLoginStage("authenticating");
      await sdkInstance.magic.auth.loginWithMagicLink({ email, showUI: false });
    } catch (error) {
      setLoginStage("failure");
      throw error;
    }

    setLoginStage("initializing_connext");
    await sdkInstance.authenticateWithMagic(); // TODO: handle errors
    setLoginStage("success");
    onLoginComplete(true); // new login
    sdkInstance.checkDepositSubscription();
  };

  return (
    <div className="flex-column">
      {loginStage === "authenticating" ? (
        <h3>Check your email for a login link!</h3>
      ) : loginStage === "initializing_connext" ? (
        <h3>Setting up Connext...</h3>
      ) : loginStage === "success" ? (
        <h3>Login successful!</h3>
      ) : loginStage === "failure" ? (
        <h3>Login failed - try again!</h3>
      ) : loginStage === "choose_user" ? (
        <>
          <form onSubmit={loginUser}>
            <h3>Please enter your email to login.</h3>
            <input
              required
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Send me a login link!</button>
          </form>
        </>
      ) : (
        <h3>Connext</h3>
      )}
    </div>
  );
}

export default LoginModal;
