export type ListingFieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "textarea"
  | "date";

export type ListingFieldDefinition = {
  id: string;
  label: string;
  type: ListingFieldType;
  required: boolean;
  public: boolean;
  unit?: string;
  placeholder?: string;
  options?: string[];
  order: number;
};

export type ListingFieldConfig = {
  id: string;
  name: string;
  propertyTypes: string[];
  fields: ListingFieldDefinition[];
};

export const DEFAULT_LISTING_FIELD_CONFIGS: ListingFieldConfig[] = [
  {
    id: "industrial",
    name: "صنعتی",
    propertyTypes: ["سوله", "کارخانه", "کارگاه", "انبار", "زمین صنعتی", "صنعتی", "سوله صنعتی", "کارگاه صنعتی"],
    fields: [
      {
        id: "ceilingHeight",
        label: "ارتفاع مفید سقف",
        type: "number",
        required: false,
        public: true,
        unit: "متر",
        placeholder: "مثلاً 7",
        order: 1,
      },
      {
        id: "electricity",
        label: "نوع برق",
        type: "select",
        required: false,
        public: true,
        options: ["ندارد", "تک‌فاز", "سه‌فاز", "سه‌فاز صنعتی"],
        order: 2,
      },
      {
        id: "electricityAmps",
        label: "آمپر برق",
        type: "number",
        required: false,
        public: true,
        unit: "آمپر",
        placeholder: "مثلاً 100",
        order: 3,
      },
      {
        id: "gas",
        label: "گاز",
        type: "boolean",
        required: false,
        public: true,
        order: 4,
      },
      {
        id: "floorType",
        label: "نوع کف",
        type: "select",
        required: false,
        public: true,
        options: ["بتن صنعتی", "سنگ", "موزاییک", "اپوکسی", "خاک", "سایر"],
        order: 5,
      },
      {
        id: "truckAccess",
        label: "دسترسی کامیون و تریلی",
        type: "boolean",
        required: false,
        public: true,
        order: 6,
      },
      {
        id: "doorWidth",
        label: "عرض درب ورودی",
        type: "number",
        required: false,
        public: true,
        unit: "متر",
        order: 7,
      },
      {
        id: "crane",
        label: "جرثقیل سقفی",
        type: "select",
        required: false,
        public: true,
        options: ["ندارد", "دارد", "قابل نصب"],
        order: 8,
      },
      {
        id: "yardArea",
        label: "مساحت محوطه",
        type: "number",
        required: false,
        public: true,
        unit: "مترمربع",
        order: 9,
      },
      {
        id: "officeArea",
        label: "مساحت بخش اداری",
        type: "number",
        required: false,
        public: true,
        unit: "مترمربع",
        order: 10,
      },
      {
        id: "industrialUsage",
        label: "مناسب برای",
        type: "textarea",
        required: false,
        public: true,
        placeholder: "مثلاً انبار، تولید سبک، کارگاه فلزی و...",
        order: 11,
      },
    ],
  },
  {
    id: "office",
    name: "اداری",
    propertyTypes: ["دفتر اداری", "واحد اداری", "اداری", "دفتر کار", "تجاری"],
    fields: [
      {
        id: "floor",
        label: "طبقه",
        type: "number",
        required: false,
        public: true,
        order: 1,
      },
      {
        id: "elevator",
        label: "آسانسور",
        type: "boolean",
        required: false,
        public: true,
        order: 2,
      },
      {
        id: "parkingCount",
        label: "تعداد پارکینگ",
        type: "number",
        required: false,
        public: true,
        unit: "واحد",
        order: 3,
      },
      {
        id: "officialUsage",
        label: "کاربری اداری رسمی",
        type: "boolean",
        required: false,
        public: true,
        order: 4,
      },
      {
        id: "buildingAge",
        label: "سن بنا",
        type: "number",
        required: false,
        public: true,
        unit: "سال",
        order: 5,
      },
      {
        id: "hvac",
        label: "سرمایش و گرمایش",
        type: "select",
        required: false,
        public: true,
        options: ["اسپلیت", "داکت اسپلیت", "چیلر", "پکیج", "فن‌کویل", "سایر"],
        order: 6,
      },
      {
        id: "furnished",
        label: "مبله",
        type: "boolean",
        required: false,
        public: true,
        order: 7,
      },
      {
        id: "meetingRoom",
        label: "اتاق جلسه",
        type: "boolean",
        required: false,
        public: true,
        order: 8,
      },
      {
        id: "light",
        label: "نورگیری",
        type: "select",
        required: false,
        public: true,
        options: ["عالی", "خوب", "معمولی"],
        order: 9,
      },
      {
        id: "officeAmenities",
        label: "ادیوسازنات و توضیحات اداری",
        type: "textarea",
        required: false,
        public: true,
        placeholder: "لابی، نگهبانی، سالن انتظار، اینترنت، تابلوخور و...",
        order: 10,
      },
    ],
  },
];

export function configForPropertyType(
  configs: ListingFieldConfig[],
  propertyType: string,
): ListingFieldConfig | null {
  return (
    configs.find((config) => config.propertyTypes.includes(propertyType)) ?? null
  );
}
