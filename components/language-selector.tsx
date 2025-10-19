"use client";

import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-3">
      <Languages className="h-4 w-4 text-gray-500" />
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {t("settings.language")}
        </label>
        <Select
          value={language}
          onValueChange={(value) => setLanguage(value as "zh" | "en")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zh">{t("settings.chinese")}</SelectItem>
            <SelectItem value="en">{t("settings.english")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
