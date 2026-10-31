import Toast from "react-native-toast-message";

export const showToast = {
  success: (message, title = "Success") =>
    Toast.show({ type: "success", text1: title, text2: message, visibilityTime: 3000, position: "top" }),

  error: (message, title = "Error") =>
    Toast.show({ type: "error", text1: title, text2: message, visibilityTime: 4000, position: "top" }),

  info: (message, title = "Info") =>
    Toast.show({ type: "info", text1: title, text2: message, visibilityTime: 3000, position: "top" }),

  warning: (message, title = "Warning") =>
    Toast.show({ type: "info", text1: title, text2: message, visibilityTime: 3500, position: "top" }),
};

export default showToast;
