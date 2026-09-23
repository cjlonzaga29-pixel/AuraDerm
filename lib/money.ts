export function formatMoney(minorUnits: number, currency: string = "PHP"): string {
  if (!Number.isInteger(minorUnits) || Number.isNaN(minorUnits)) {
    throw new Error(`Invalid minorUnits: ${minorUnits}. Must be an integer.`);
  }

  const isNegative = minorUnits < 0;
  const absMinor = Math.abs(minorUnits);
  const major = Math.floor(absMinor / 100);
  const minor = absMinor % 100;
  const formattedMajor = major.toLocaleString("en-PH");
  const formattedMinor = minor.toString().padStart(2, "0");

  const sign = isNegative ? "-" : "";
  const symbol = currency === "PHP" ? "₱" : `${currency} `;

  return `${sign}${symbol}${formattedMajor}.${formattedMinor}`;
}

export function addMoney(...amounts: number[]): number {
  return amounts.reduce((acc, curr) => {
    if (!Number.isInteger(curr) || Number.isNaN(curr)) {
      throw new Error(`Invalid minorUnits in sum: ${curr}`);
    }
    return acc + curr;
  }, 0);
}

export function multiplyMoney(minorUnits: number, quantity: number): number {
  if (!Number.isInteger(minorUnits) || !Number.isInteger(quantity)) {
    throw new Error("Both minorUnits and quantity must be integers.");
  }
  return minorUnits * quantity;
}
