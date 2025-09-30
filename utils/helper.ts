export const getCookie = (name: string): string | undefined => {
  // Check if we're on the client side
  if (typeof window === "undefined") {
    return undefined;
  }

  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
};

// For setting cookies
export const setCookie = (name: string, value: string, days = 20) => {
  if (typeof window === "undefined") {
    return;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  document.cookie = `${name}=${value}; expires=${expiryDate.toUTCString()}; path=/`;
};
