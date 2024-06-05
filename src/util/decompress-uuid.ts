export function decompressUUID(compressedUUID: string) {
  compressedUUID = compressedUUID.toLowerCase();
  if (compressedUUID.length !== 32) {
    throw new Error("Invalid compressed UUID length");
  }

  for (let index = 0; index < compressedUUID.length; index++) {
    const charCode = compressedUUID.codePointAt(index) ?? -1;
    if (
      (charCode >= 48 && charCode <= 57) ||
      (charCode >= 97 && charCode <= 102)
    ) {
      continue;
    }
    throw new Error("Invalid compressed UUID format: Illegal Character");
  }

  // Define the positions where hyphens should be inserted
  const positions = [8, 12, 16, 20];
  let decompressedUUID = compressedUUID;

  // Insert hyphens at the appropriate positions
  for (let index = positions.length - 1; index >= 0; index--) {
    decompressedUUID =
      decompressedUUID.slice(0, positions[index]) +
      "-" +
      decompressedUUID.slice(positions[index]);
  }

  return decompressedUUID;
}
