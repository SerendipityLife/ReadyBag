import { useState } from "react";
import { Calendar, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface TravelDateSelectorProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onDatesChange: (startDate: Date | null, endDate: Date | null) => void;
}

export function TravelDateSelector({ startDate, endDate, onDatesChange }: TravelDateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>(
    startDate ? format(startDate, "yyyy-MM-dd") : ""
  );
  const [tempEndDate, setTempEndDate] = useState<string>(
    endDate ? format(endDate, "yyyy-MM-dd") : ""
  );

  const handleSave = () => {
    const start = tempStartDate ? new Date(tempStartDate) : null;
    const end = tempEndDate ? new Date(tempEndDate) : null;
    onDatesChange(start, end);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate("");
    setTempEndDate("");
    onDatesChange(null, null);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return "여행 날짜 선택";
    if (!startDate) return "시작일 미설정";
    if (!endDate) return format(startDate, "MM/dd", { locale: ko });
    return `${format(startDate, "MM/dd", { locale: ko })} - ${format(endDate, "MM/dd", { locale: ko })}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start text-left font-normal text-xs h-6 px-2 hover:bg-gray-50"
        >
          <CalendarDays className="mr-1 h-3 w-3" />
          <span className="truncate">{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">여행 시작일</Label>
            <Input
              id="start-date"
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">여행 종료일</Label>
            <Input
              id="end-date"
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              min={tempStartDate}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              저장
            </Button>
            <Button variant="outline" onClick={handleClear} className="flex-1">
              초기화
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}