export function randomString(
  length: number,
  charset: string = "alphanumeric"
): string {
  if (length <= 0) {
    throw new Error("Length must be a positive integer");
  }

  const characters: string =
    {
      alphanumeric:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      numeric: "0123456789",
      hex: "0123456789abcdef",
    }[charset] || charset;

  if (!characters) {
    throw new Error(`Invalid character set: ${charset}`);
  }

  const charactersLength = characters.length;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
