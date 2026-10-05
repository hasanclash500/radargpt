import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ListingFieldConfig, ListingFieldDefinition, ListingFieldType } from "@/lib/listing-field-config";
import { Plus, Save, Settings2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const TYPES: { value: ListingFieldType; label: string }[] = [
  { value: "text", label: "متن" },
  { value: "number", label: "عدد" },
  { value: "boolean", label: "بله/خیر" },
  { value: "select", label: "انتخابی" },
  { value: "textarea", label: "متن بلند" },
  { value: "date", label: "تاریخ شمسی" },
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ListingFieldConfigManager({
  configs,
  onSave,
}: {
  configs: ListingFieldConfig[];
  onSave: (configs: ListingFieldConfig[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ListingFieldConfig[]>(configs);
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(configs);
    setSelected((value) => Math.min(value, Math.max(0, configs.length - 1)));
  }, [configs]);

  const current = draft[selected];

  const updateCategory = (patch: Partial<ListingFieldConfig>) => {
    setDraft((items) =>
      items.map((item, index) => (index === selected ? { ...item, ...patch } : item)),
    );
  };

  const updateField = (fieldIndex: number, patch: Partial<ListingFieldDefinition>) => {
    if (!current) return;
    const fields = current.fields.map((field, index) =>
      index === fieldIndex ? { ...field, ...patch } : field,
    );
    updateCategory({ fields });
  };

  const addField = () => {
    if (!current) return;
    updateCategory({
      fields: [
        ...current.fields,
        {
          id: uid("field"),
          label: "فیلد جدید",
          type: "text",
          required: false,
          public: true,
          order: current.fields.length + 1,
        },
      ],
    });
  };

  const removeField = (index: number) => {
    if (!current) return;
    updateCategory({
      fields: current.fields
        .filter((_, i) => i !== index)
        .map((field, i) => ({ ...field, order: i + 1 })),
    });
  };

  const addCategory = () => {
    const next: ListingFieldConfig = {
      id: uid("category"),
      name: "دسته جدید",
      propertyTypes: [],
      fields: [],
    };
    setDraft((items) => [...items, next]);
    setSelected(draft.length);
  };

  const removeCategory = () => {
    if (!current) return;
    if (!window.confirm(`دسته «${current.name}» حذف شود؟`)) return;
    setDraft((items) => items.filter((_, index) => index !== selected));
    setSelected(0);
  };

  const save = async () => {
    const cleaned = draft.map((category) => ({
      ...category,
      name: category.name.trim() || "بدون نام",
      propertyTypes: category.propertyTypes.map((x) => x.trim()).filter(Boolean),
      fields: category.fields.map((field, index) => ({
        ...field,
        label: field.label.trim() || `فیلد ${index + 1}`,
        unit: field.unit?.trim() || undefined,
        placeholder: field.placeholder?.trim() || undefined,
        options:
          field.type === "select"
            ? (field.options ?? []).map((x) => x.trim()).filter(Boolean)
            : undefined,
        order: index + 1,
      })),
    }));

    setSaving(true);
    try {
      await onSave(cleaned);
      toast.success("ساختار فرم آگهی ذخیره شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره ساختار فرم ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="size-5" />
          فیلدهای فرم آگهی
        </CardTitle>
        <CardDescription>
          برای هر گروه ملک فیلدهای جدا بسازید. تغییرات بلافاصله در مرحله دوم فرم ثبت آگهی استفاده می‌شوند.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {draft.map((category, index) => (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={selected === index ? "default" : "outline"}
              onClick={() => setSelected(index)}
              className="shrink-0"
            >
              {category.name}
            </Button>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={addCategory} className="shrink-0 gap-1">
            <Plus className="size-4" />
            دسته جدید
          </Button>
        </div>

        {current ? (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-border/70 p-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold">نام گروه</label>
                <Input value={current.name} onChange={(e) => updateCategory({ name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold">نوع ملک‌های این گروه</label>
                <Input
                  value={current.propertyTypes.join("، ")}
                  onChange={(e) =>
                    updateCategory({
                      propertyTypes: e.target.value.split(/[،,]/).map((x) => x.trim()).filter(Boolean),
                    })
                  }
                  placeholder="سوله، کارخانه، کارگاه"
                />
              </div>
            </div>

            <div className="space-y-3">
              {current.fields.map((field, index) => (
                <div key={field.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold">عنوان فیلد</label>
                      <Input value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold">نوع</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as ListingFieldType })}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                      >
                        {TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold">واحد</label>
                      <Input value={field.unit ?? ""} onChange={(e) => updateField(index, { unit: e.target.value })} placeholder="متر، آمپر..." />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold">Placeholder</label>
                      <Input value={field.placeholder ?? ""} onChange={(e) => updateField(index, { placeholder: e.target.value })} />
                    </div>
                  </div>

                  {field.type === "select" && (
                    <div className="mt-3">
                      <label className="mb-1.5 block text-[11px] font-bold">گزینه‌ها</label>
                      <Input
                        value={(field.options ?? []).join("، ")}
                        onChange={(e) =>
                          updateField(index, {
                            options: e.target.value.split(/[،,]/).map((x) => x.trim()).filter(Boolean),
                          })
                        }
                        placeholder="گزینه اول، گزینه دوم"
                      />
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-5">
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <Switch checked={field.required} onCheckedChange={(value) => updateField(index, { required: value })} />
                      اجباری
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <Switch checked={field.public} onCheckedChange={(value) => updateField(index, { public: value })} />
                      نمایش عمومی
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mr-auto gap-1 text-destructive"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="size-4" />
                      حذف فیلد
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-between gap-2">
              <Button type="button" variant="outline" onClick={addField} className="gap-1.5">
                <Plus className="size-4" />
                افزودن فیلد
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="text-destructive" onClick={removeCategory}>
                  حذف دسته
                </Button>
                <Button type="button" onClick={() => void save()} disabled={saving} className="gap-1.5">
                  <Save className="size-4" />
                  ذخیره ساختار
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
