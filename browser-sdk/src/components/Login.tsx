import React, { useState, useEffect } from "react";
import ConnextSDK from "..";

interface ILoginProps {
  sdkInstance: ConnextSDK;
  stage: string;
  onSubmit: (value?: any) => void;
}

function Login({ sdkInstance, stage, onSubmit }: ILoginProps) {
  const [email, setEmail] = useState("");

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      console.error("Invalid email!");
      return;
    }

    onSubmit({ email });
  };

  return (
    <div className="flex-column">
      {stage === "authenticating" ? (
        <h3>Check your email for a login link!</h3>
      ) : stage === "initializing_connext" ? (
        <h3>Setting up Connext...</h3>
      ) : stage === "success" ? (
        <h3>Login successful!</h3>
      ) : stage === "failure" ? (
        <h3>Login failed - try again!</h3>
      ) : stage === "choose_user" ? (
        <>
          <form onSubmit={onFormSubmit}>
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

export default Login;
