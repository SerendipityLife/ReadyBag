import { useState, useEffect } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAppContext } from "@/contexts/AppContext";
import { DateRange } from "react-day-picker";

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
  const [isNewDateModalOpen, setIsNewDateModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDate || undefined,
    to: endDate || undefined,
  });

  // 캘린더 활성화 상태 감지
  useEffect(() => {
    if (shouldActivateCalendar) {
      setIsOpen(true);
      setIsNewDateModalOpen(true);
      setShouldActivateCalendar(false);
    }
  }, [shouldActivateCalendar, setShouldActivateCalendar]);

  // 여행 날짜 선택 UI 표시 상태 감지
  useEffect(() => {
    if (showTravelDateSelector) {
      setIsOpen(true);
      setIsNewDateModalOpen(true);
      setShowTravelDateSelector(false);
    }
  }, [showTravelDateSelector, setShowTravelDateSelector]);

  // 날짜 범위가 변경될 때 상태 업데이트
  useEffect(() => {
    setDateRange({
      from: startDate || undefined,
      to: endDate || undefined,
    });
  }, [startDate, endDate]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleSave = () => {
    if (dateRange?.from && dateRange?.to) {
      // 새 여행 날짜 저장
      const travelDateId = addTravelDate(dateRange.from, dateRange.to);
      onDatesChange(dateRange.from, dateRange.to);
    }
    
    setIsNewDateModalOpen(false);
    setIsOpen(false);
  };

  const handleClear = () => {
    setDateRange(undefined);
    onDatesChange(null, null);
    setIsNewDateModalOpen(false);
    setIsOpen(false);
  };

  const handleSelectSavedDate = (travelDateId: string) => {
    const selectedDate = savedTravelDates.find(date => date.id === travelDateId);
    if (selectedDate) {
      setSelectedTravelDateId(travelDateId);
      onDatesChange(selectedDate.startDate, selectedDate.endDate);
      setDateRange({
        from: selectedDate.startDate,
        to: selectedDate.endDate,
      });
      
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
      setDateRange(undefined);
    }
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return "여행 날짜 선택";
    if (!startDate) return "시작일 미설정";
    if (!endDate) return format(startDate, "yyyy.MM.dd", { locale: ko });
    return `${format(startDate, "yyyy.MM.dd", { locale: ko })} - ${format(endDate, "yyyy.MM.dd", { locale: ko })}`;
  };

  const formatCalendarDateRange = () => {
    if (!dateRange?.from && !dateRange?.to) return "날짜를 선택하세요";
    if (!dateRange?.from) return "시작일 미설정";
    if (!dateRange?.to) return format(dateRange.from, "yyyy.MM.dd", { locale: ko });
    return `${format(dateRange.from, "yyyy.MM.dd", { locale: ko })} - ${format(dateRange.to, "yyyy.MM.dd", { locale: ko })}`;
  };

  return (
    <div className="flex items-center gap-1">
      {savedTravelDates.length > 0 ? (
        // 저장된 날짜가 있는 경우: 선택된 날짜 표시만 (새 날짜 추가는 드롭다운 안에)
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="default"
              className="bg-sky-500 hover:bg-sky-600 text-white border-sky-500 h-8 text-[10px] px-2 min-w-[180px] max-w-[200px] shadow-md"
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
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-base text-gray-900 mb-2">여행 날짜 선택</h3>
                <p className="text-sm text-gray-700">출발일과 도착일을 선택해주세요</p>
              </div>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={1}
                className="rounded-md border w-full"
                locale={ko}
              />
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSave} 
                  className="flex-1"
                  disabled={!dateRange?.from || !dateRange?.to}
                >
                  저장
                </Button>
                <Button variant="outline" onClick={handleClear} className="flex-1">
                  초기화
                </Button>
              </div>
              
              {/* 저장된 날짜 리스트 - 캘린더 아래 */}
              {savedTravelDates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-sm text-gray-900 mb-3">저장된 여행 날짜</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {savedTravelDates.map((travelDate) => (
                      <div key={travelDate.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 border border-gray-100">
                        <button
                          className="flex-1 text-left text-xs text-gray-800 hover:bg-transparent"
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
                  </div>
                </div>
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
                variant="default"
                className="bg-sky-500 hover:bg-sky-600 text-white border-sky-500 h-8 text-[10px] px-2 min-w-[180px] max-w-[200px] shadow-md"
              >
                <CalendarDays className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                  날짜선택
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-base text-gray-900 mb-2">여행 날짜 선택</h3>
                  <p className="text-sm text-gray-700">출발일과 도착일을 선택해주세요</p>
                </div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={1}
                  className="rounded-md border w-full"
                  locale={ko}
                />
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleSave} 
                    className="flex-1"
                    disabled={!dateRange?.from || !dateRange?.to}
                  >
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