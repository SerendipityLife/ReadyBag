import { useState, useEffect } from "react";
import { Calendar, CalendarDays, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAppContext } from "@/contexts/AppContext";

interface TravelDateSelectorProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onDatesChange: (startDate: Date | null, endDate: Date | null) => void;
  mode?: 'browse' | 'select'; // browse mode allows creating new dates, select mode only allows selecting existing ones
}

export function TravelDateSelector({ startDate, endDate, onDatesChange, mode = 'browse' }: TravelDateSelectorProps) {
  const { 
    shouldActivateCalendar, 
    setShouldActivateCalendar,
    showTravelDateSelector,
    setShowTravelDateSelector,
    savedTravelDates,
    selectedTravelDateId,
    setSelectedTravelDateId,
    addTravelDate,
    removeTravelDate
  } = useAppContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>(
    startDate ? format(startDate, "yyyy-MM-dd") : ""
  );
  const [tempEndDate, setTempEndDate] = useState<string>(
    endDate ? format(endDate, "yyyy-MM-dd") : ""
  );

  // 캘린더 활성화 상태 감지
  useEffect(() => {
    if (shouldActivateCalendar) {
      setIsOpen(true);
      setShouldActivateCalendar(false);
    }
  }, [shouldActivateCalendar, setShouldActivateCalendar]);

  // 여행 날짜 선택 UI 표시 상태 감지
  useEffect(() => {
    if (showTravelDateSelector) {
      setIsOpen(true);
      setShowTravelDateSelector(false);
    }
  }, [showTravelDateSelector, setShowTravelDateSelector]);

  const handleSave = () => {
    const start = tempStartDate ? new Date(tempStartDate) : null;
    const end = tempEndDate ? new Date(tempEndDate) : null;
    
    if (start && end) {
      // 새 여행 날짜 저장
      const travelDateId = addTravelDate(start, end);
      onDatesChange(start, end);
    }
    
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate("");
    setTempEndDate("");
    onDatesChange(null, null);
    setIsOpen(false);
  };

  const handleSelectSavedDate = (travelDateId: string) => {
    const selectedDate = savedTravelDates.find(date => date.id === travelDateId);
    if (selectedDate) {
      setSelectedTravelDateId(travelDateId);
      onDatesChange(selectedDate.startDate, selectedDate.endDate);
      setTempStartDate(format(selectedDate.startDate, "yyyy-MM-dd"));
      setTempEndDate(format(selectedDate.endDate, "yyyy-MM-dd"));
      
      console.log(`[TravelDateSelector] 여행 날짜 선택됨: ${travelDateId} (${selectedDate.label})`);
      console.log(`[TravelDateSelector] Context 업데이트 전 selectedTravelDateId:`, selectedTravelDateId);
      
      // localStorage에 선택된 날짜 ID 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedTravelDateId', travelDateId);
        console.log(`[TravelDateSelector] localStorage에 저장됨:`, travelDateId);
      }
    }
  };

  const handleDeleteSavedDate = (travelDateId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Deleting travel date:', travelDateId);
    removeTravelDate(travelDateId);
    
    // If the deleted date was selected, clear the selection
    if (selectedTravelDateId === travelDateId) {
      setSelectedTravelDateId(null);
      onDatesChange(null, null);
      setTempStartDate("");
      setTempEndDate("");
    }
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return "여행 날짜 선택";
    if (!startDate) return "시작일 미설정";
    if (!endDate) return format(startDate, "yyyy.MM.dd", { locale: ko });
    return `${format(startDate, "yyyy.MM.dd", { locale: ko })} - ${format(endDate, "yyyy.MM.dd", { locale: ko })}`;
  };

  return (
    <div className="flex items-center gap-1">
      {savedTravelDates.length > 0 ? (
        // 저장된 날짜가 있는 경우: 선택된 날짜 표시만 (새 날짜 추가는 드롭다운 안에)
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="default"
              className="bg-[#7B5E57] hover:bg-[#6B4E47] text-white border-[#7B5E57] h-8 text-[10px] px-2 min-w-[180px] max-w-[200px] shadow-sm"
            >
              <CalendarDays className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                {selectedTravelDateId 
                  ? savedTravelDates.find(d => d.id === selectedTravelDateId)?.label || "날짜선택"
                  : "날짜선택"
                }
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <div className="space-y-1">
              {/* 저장된 날짜 목록 */}
              {savedTravelDates.map((travelDate) => (
                <div key={travelDate.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <button
                    className="flex-1 text-left text-xs"
                    onClick={() => handleSelectSavedDate(travelDate.id)}
                  >
                    {travelDate.label}
                  </button>
                  {mode === 'browse' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2 hover:bg-red-100 flex-shrink-0"
                      onClick={(e) => handleDeleteSavedDate(travelDate.id, e)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              
              {/* 새 날짜 추가 버튼 - 목록 하단에 위치 */}
              {mode === 'browse' && (
                <>
                  <div className="border-t border-gray-200 my-1"></div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full flex items-center justify-center p-2 rounded hover:bg-blue-50 text-blue-600">
                        <Plus className="h-3 w-3 mr-1" />
                        <span className="text-xs">새 날짜 추가</span>
                      </button>
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
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        // 저장된 날짜가 없는 경우: 여행 날짜 선택 버튼만 표시
        mode === 'browse' && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 text-xs px-3"
              >
                <CalendarDays className="h-3 w-3 mr-1" />
                {formatDateRange()}
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
        )
      )}
    </div>
  );
}