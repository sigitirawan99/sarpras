export function generateSarprasCode(
  nama: string,
  kategoriNama: string,
  kondisi: string
): string {
  const katPart = (kategoriNama || "XYZ").substring(0, 3).toUpperCase().trim();
  const namaPart = (nama || "ABC").substring(0, 3).toUpperCase().trim();

  let condPart = "BK";
  if (kondisi === "rusak_ringan") condPart = "RR";
  else if (kondisi === "rusak_berat") condPart = "RB";
  else if (kondisi === "hilang") condPart = "HL";

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${katPart}-${namaPart}-${condPart}-${datePart}-${randPart}`;
}
