/** Shared API shapes (Go JSON uses exported field names). */

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type ApiUser = {
  ID: string;
  PhoneNumber: string;
  FullName: string;
  Role: string;
  Status?: string;
  KelurahanID?: number | null;
  RtRw?: string | null;
};

export type SkillCategory = {
  ID: number;
  Name: string;
  IconURL?: string | null;
  Description?: string | null;
};

export type Kelurahan = {
  ID: number;
  Name: string;
  Kecamatan?: string | null;
  Kota?: string | null;
};

export type ApiNullPoint = {
  Lat: number;
  Lng: number;
  Valid: boolean;
};

export type ApiOrder = {
  ID: string;
  ConsumerID: string;
  WorkerID?: string | null;
  SkillID: number;
  Status: string;
  Description?: string | null;
  ConsumerLocation: ApiNullPoint;
  ConsumerAddress?: string | null;
  AgreedRate?: number | null;
  PlatformFee: number;
  PaymentMethodFee?: string | null;
  PaymentStatus: string;
  CreatedAt: string;
  Skill?: SkillCategory;
  Worker?: ApiUser | null;
  Logs?: ApiOrderStatusLog[];
};

export type ApiOrderStatusLog = {
  ID: string;
  OrderID: string;
  FromStatus?: string | null;
  ToStatus: string;
  ChangeTime: string;
  Note?: string | null;
};

export type RegisterWorkerResult = {
  user: ApiUser;
  worker_profile?: { ID: string; UserID: string; Availability: string };
  ocr_preview: {
    nik: string;
    full_name: string;
  };
};

export type ApiResult<T> = {
  ok: boolean;
  data: T;
  error?: string;
};

export type UploadedFilePayload = {
  name: string;
  mimeType: string;
  data: string;
};

export type RegisterWorkerPayload = {
  phone_number: string;
  full_name: string;
  rt_rw?: string;
  kelurahan_id: number;
  skill_ids: number[];
  ktp_photo: UploadedFilePayload;
  profile_photo: UploadedFilePayload;
};
