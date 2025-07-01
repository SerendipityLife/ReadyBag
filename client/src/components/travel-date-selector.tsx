
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Check, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useAppContext } from '../contexts/AppContext';

interface TravelDateSelectorProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onDatesChange?: (start: Date | null, end: Date | null) => void;
  mode?: string;
  onClose?: () => void;
}

export const TravelDateSelector: React.FC<TravelDateSelectorProps> = ({ startDate, endDate, onDatesChange, mode, onClose }) => {
  const {
    travelStartDate,
    setTravelStartDate,
    travelEndDate,
    setTravelEndDate,
    savedTravelDates,
    selectedTravelDateId,
    addTravelDate,
    setSelectedTravelDateId,
    removeTravelDate,
    showTravelDateSelector,
    setShowTravelDateSelector
  } = useAppContext();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(travelStartDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(travelEndDate);
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!isSelectingEndDate && (!tempStartDate || date < tempStartDate)) {
      setTempStartDate(date);
      setTempEndDate(null);
      setIsSelectingEndDate(true);
    } else if (isSelectingEndDate || (tempStartDate && date >= tempStartDate)) {
      setTempEndDate(date);
      setIsSelectingEndDate(false);
    } else {
      setTempStartDate(date);
      setTempEndDate(null);
      setIsSelectingEndDate(true);
    }
  };

  const handleSaveDates = () => {
    if (tempStartDate && tempEndDate) {
      const newTravelDateId = addTravelDate(tempStartDate, tempEndDate);
      setTravelStartDate(tempStartDate);
      setTravelEndDate(tempEndDate);
      setIsCalendarOpen(false);
      console.log('[TravelDateSelector] 새 여행 날짜 추가됨:', newTravelDateId);
      console.log('[TravelDateSelector] 각 여행 날짜별로 독립적인 숙박지를 설정할 수 있습니다.');
    }
  };

  const handleSelectSavedDate = (travelDateId: string) => {
    setSelectedTravelDateId(travelDateId);
    const savedDate = savedTravelDates.find(d => d.id === travelDateId);
    if (savedDate) {
      setTravelStartDate(savedDate.startDate);
      setTravelEndDate(savedDate.endDate);
    }
  };

  const handleClose = () => {
    setShowTravelDateSelector(false);
    if (onClose) {
      onClose();
    }
  };

  // Browse mode: compact dropdown for header
  if (mode === "browse") {
    return (
      <div className="relative">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {selectedTravelDateId 
                ? savedTravelDates.find(d => d.id === selectedTravelDateId)?.label || "여행 날짜"
                : "여행 날짜"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">여행 날짜 선택</h4>
              
              {/* 저장된 여행 날짜 목록 */}
              {savedTravelDates.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {savedTravelDates.map((savedDate) => (
                    <div
                      key={savedDate.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-gray-50 text-xs",
                        selectedTravelDateId === savedDate.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      )}
                      onClick={() => handleSelectSavedDate(savedDate.id)}
                    >
                      <span>{savedDate.label}</span>
                      {selectedTravelDateId === savedDate.id && (
                        <Check className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 새 날짜 추가 버튼 */}
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-xs h-7"
                onClick={() => setShowTravelDateSelector(true)}
              >
                새 날짜 추가
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Modal mode: full date selection modal
  if (!showTravelDateSelector) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">여행 날짜 선택</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 저장된 여행 날짜 목록 */}
        {savedTravelDates.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">저장된 여행 날짜</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {savedTravelDates.map((savedDate) => (
                <div
                  key={savedDate.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-gray-50",
                    selectedTravelDateId === savedDate.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  )}
                  onClick={() => handleSelectSavedDate(savedDate.id)}
                >
                  <span className="text-sm">{savedDate.label}</span>
                  {selectedTravelDateId === savedDate.id && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 새 날짜 추가 */}
        <div className="space-y-4">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {tempStartDate && tempEndDate
                  ? `${format(tempStartDate, 'yyyy.MM.dd', { locale: ko })} - ${format(tempEndDate, 'yyyy.MM.dd', { locale: ko })}`
                  : tempStartDate
                  ? `${format(tempStartDate, 'yyyy.MM.dd', { locale: ko })} - 종료일 선택`
                  : "새 여행 날짜 추가"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={isSelectingEndDate ? tempEndDate || undefined : tempStartDate || undefined}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                initialFocus
              />
              {tempStartDate && tempEndDate && (
                <div className="p-3 border-t">
                  <Button onClick={handleSaveDates} className="w-full" size="sm">
                    날짜 저장
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleClose}
            className="flex-1"
            disabled={!selectedTravelDateId}
          >
            완료
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TravelDateSelector;
