export const getExpiryDate = (year : number) => {
  const expireDate = new Date();
  expireDate.setFullYear(expireDate.getFullYear() + year);
  return expireDate.toUTCString();
};
