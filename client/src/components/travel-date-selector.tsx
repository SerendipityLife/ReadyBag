import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Check, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useAppContext } from '../contexts/AppContext';

export const TravelDateSelector: React.FC = () => {
  const {
    travelStartDate,
    setTravelStartDate,
    travelEndDate,
    setTravelEndDate,
    savedTravelDates,
    selectedTravelDateId,
    addTravelDate,
    setSelectedTravelDateId,
    showTravelDateSelector,
    setShowTravelDateSelector
  } = useAppContext();

  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false);
  const [showNewDateForm, setShowNewDateForm] = useState(false);

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
      setSelectedTravelDateId(newTravelDateId);
      handleClose();
      console.log('[TravelDateSelector] 새 여행 날짜 추가됨:', newTravelDateId);
    }
  };

  const handleSelectSavedDate = (travelDateId: string) => {
    setSelectedTravelDateId(travelDateId);
    const savedDate = savedTravelDates.find(d => d.id === travelDateId);
    if (savedDate) {
      setTravelStartDate(savedDate.startDate);
      setTravelEndDate(savedDate.endDate);
    }
    handleClose();
  };

  const handleClose = () => {
    setShowTravelDateSelector(false);
    setShowNewDateForm(false);
    setTempStartDate(null);
    setTempEndDate(null);
    setIsSelectingEndDate(false);
  };

  const resetNewDateForm = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setIsSelectingEndDate(false);
  };

  if (!showTravelDateSelector) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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

        {!showNewDateForm ? (
          <div className="space-y-4">
            {/* 저장된 여행 날짜 목록 */}
            {savedTravelDates.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3">저장된 여행 날짜</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedTravelDates.map((savedDate) => (
                    <div
                      key={savedDate.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors",
                        selectedTravelDateId === savedDate.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      )}
                      onClick={() => handleSelectSavedDate(savedDate.id)}
                    >
                      <span className="text-sm font-medium">{savedDate.label}</span>
                      {selectedTravelDateId === savedDate.id && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 새 날짜 추가 버튼 */}
            <Button
              variant="outline"
              onClick={() => {
                setShowNewDateForm(true);
                resetNewDateForm();
              }}
              className="w-full flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              새 여행 날짜 추가
            </Button>

            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full"
            >
              취소
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 새 날짜 선택 폼 */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                {!tempStartDate ? "출발 날짜를 선택하세요" : 
                 !tempEndDate ? "도착 날짜를 선택하세요" : 
                 "날짜 선택이 완료되었습니다"}
              </p>

              {tempStartDate && tempEndDate && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-blue-800">
                    {format(tempStartDate, 'yyyy년 MM월 dd일', { locale: ko })} - {format(tempEndDate, 'yyyy년 MM월 dd일', { locale: ko })}
                  </p>
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Calendar
                mode="single"
                selected={isSelectingEndDate ? tempEndDate || undefined : tempStartDate || undefined}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                initialFocus
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewDateForm(false)}
                className="flex-1"
              >
                뒤로
              </Button>
              {tempStartDate && tempEndDate && (
                <Button
                  onClick={handleSaveDates}
                  className="flex-1"
                >
                  저장
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelDateSelector;