import { LanguageText } from "../typings";

const en: LanguageText = {
  error: {
    not_logged_in: "Inicie sesión primero",
    missing_modal: "Modal no está inicializado.",
    missing_magic: "Magic no está inicializado.",
    missing_channel: "Channel no está inicializado.",
    invalid_address: "Dirección inválida!",
    invalid_amount: "Cantidad inválida!",
    invalid_email: "Correo electrónico invalido!",
    awaiting_deposit: "Esperando por depósito!",
  },
  label: {
    token_amount: "Cantidad de Token",
    ethereum_address: "Dirección de Ethereum",
    email_address: "Introduce tu correo electrónico",
  },
  action: {
    withdraw: "Retirar",
    login: "Envíame un enlace de inicio de sesión!",
  },
  warn: {
    enter_valid_address: "Por favor, ingrese una dirección válida",
  },
  info: {
    login_pending:
      "Revise su correo electrónico para obtener un enlace de inicio de sesión.",
    login_setup: "Configurando Connext...",
    login_success: "Inicio de sesión exitoso!",
    login_failure: "Inicio de sesión fallido - inténtalo de nuevo!",
    login_prompt: "Ingrese su correo electrónico para iniciar sesión.",
    deposit_pending: "Preparando depósito...",
    deposit_success: "Depósito exitoso!",
    deposit_failure: "Depósito fallido - inténtalo de nuevo!",
    deposit_show_qr: "Deposite en la siguiente dirección.",
    withdraw_prompt:
      "Por favor, ingrese la cantidad a retirar y el destinatario.",
    withdraw_success: "Retiro exitoso!",
    withdraw_failure: "Retiro fallido - inténtalo de nuevo!",
  },
};

export default en;
