import React, { useState } from "react";
import ConnextSDK from "..";

import {
  LOGIN_PENDING,
  LOGIN_SETUP,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGIN_PROMPT,
  LOGIN_SUBMIT,
} from "../constants";

interface ILoginProps {
  sdk: ConnextSDK;
  stage: string;
}

function Login({ sdk, stage }: ILoginProps) {
  const [email, setEmail] = useState("");

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      console.error(sdk.text.error.invalid_email);
      return;
    }
    sdk.emit(LOGIN_SUBMIT, { email });
  };

  return (
    <div className="flex-column">
      {stage === LOGIN_PENDING ? (
        <h3>{sdk.text.info.login_pending}</h3>
      ) : stage === LOGIN_SETUP ? (
        <h3>{sdk.text.info.login_setup}</h3>
      ) : stage === LOGIN_SUCCESS ? (
        <h3>{sdk.text.info.login_success}</h3>
      ) : stage === LOGIN_FAILURE ? (
        <h3>{sdk.text.info.login_failure}</h3>
      ) : stage === LOGIN_PROMPT ? (
        <>
          <form onSubmit={onFormSubmit}>
            <h3>{sdk.text.info.login_failure}</h3>
            <input
              required
              type="email"
              placeholder={sdk.text.label.email_address}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">{sdk.text.info.login_prompt}</button>
          </form>
        </>
      ) : (
        <h3>{`Connext`}</h3>
      )}
    </div>
  );
}

export default Login;
