import { LanguageText } from "../typings";

const en: LanguageText = {
  error: {
    not_logged_in: "Must login first",
    missing_modal: "Missing modal instance",
    missing_magic: "Missing magic instance",
    missing_channel: "Missing channel instance",
    invalid_address: "Invalid address!",
    invalid_amount: "Invalid amount!",
    invalid_email: "Invalid email!",
  },
  label: {
    token_amount: "Token Amount",
    ethereum_address: "Ethereum address",
    email_address: "Enter your email",
  },
  action: {
    withdraw: "Withdraw",
    login: "Send me a login link!",
  },
  warn: {
    enter_valid_address: "Please enter a valid address",
  },
  info: {
    withdraw_prompt: "Please enter amount to withdraw and recipient.",
    withdraw_success: "Withdraw successful!",
    withdraw_failure: "Withdraw failed - try again!",
    login_pending: "Check your email for a login link!",
    login_setup: "Setting up Connext...",
    login_success: "Login successful!",
    login_failure: "Login failed - try again!",
    login_prompt: "Please enter your email to login.",
    deposit_success: "Deposit successful!",
    deposit_failure: "Deposit failed - try again!",
    deposit_show_qr: "Please deposit to the following address.",
  },
};

export default en;
