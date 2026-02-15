export const generateSecureSerial = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  let serial = '';
  for (let i = 0; i < 8; i++) {
    serial += chars.charAt(array[i] % chars.length);
  }
  return serial;
};
