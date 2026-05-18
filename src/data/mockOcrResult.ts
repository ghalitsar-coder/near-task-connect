export interface OcrResult {
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "Laki-laki" | "Perempuan";
  alamat: string;
  rtRw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  agama: string;
  statusPerkawinan: string;
  pekerjaan: string;
}

// Returned by the fake OCR step on the agent dashboard.
export const mockOcrResult: OcrResult = {
  nik: "3174081205870001",
  nama: "AHMAD SUBANDI",
  tempatLahir: "Jakarta",
  tanggalLahir: "12-05-1987",
  jenisKelamin: "Laki-laki",
  alamat: "JL. TEBET BARAT DALAM IV NO. 8",
  rtRw: "004/007",
  kelurahan: "TEBET BARAT",
  kecamatan: "TEBET",
  kota: "JAKARTA SELATAN",
  agama: "ISLAM",
  statusPerkawinan: "KAWIN",
  pekerjaan: "WIRASWASTA",
};
