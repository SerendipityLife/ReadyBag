import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { KEYWORD_CATEGORIES, TRENDING_KEYWORDS, SIMPLE_TRENDING_KEYWORDS, TrendingKeyword } from "@/data/trending-keywords";

interface TrendingKeywordsProps {
  onKeywordSelect?: (keyword: string) => void;
  maxItems?: number;
  className?: string;
  simple?: boolean; // 단순 모드인지 여부 (탭 없이 키워드만 표시)
}

export function TrendingKeywords({
  onKeywordSelect,
  maxItems = 10,
  className = "",
  simple = false
}: TrendingKeywordsProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // 단순 모드일 경우 SIMPLE_TRENDING_KEYWORDS에서 표시할 키워드 선택
  const displaySimpleKeywords = simple 
    ? SIMPLE_TRENDING_KEYWORDS.slice(0, expanded ? SIMPLE_TRENDING_KEYWORDS.length : maxItems)
    : [];
  
  // 카테고리별 모드일 경우 현재 탭에 해당하는 키워드 필터링
  const filteredKeywords = !simple
    ? TRENDING_KEYWORDS
        .filter(keyword => keyword.category === activeTab)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, expanded ? TRENDING_KEYWORDS.length : maxItems)
    : [];

  const handleKeywordClick = (keyword: string) => {
    if (onKeywordSelect) {
      onKeywordSelect(keyword);
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          <h3 className="font-heading font-bold text-lg">인기 검색어</h3>
        </div>
      </div>

      {simple ? (
        // 단순 모드 - 배지만 표시
        <div className="flex flex-wrap gap-2">
          {displaySimpleKeywords.map((keyword) => (
            <Badge
              key={keyword}
              variant="outline"
              className="cursor-pointer hover:bg-muted transition-colors"
              onClick={() => handleKeywordClick(keyword)}
            >
              {keyword}
            </Badge>
          ))}
        </div>
      ) : (
        // 카테고리별 모드 - 탭으로 구분하여 표시
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-3 flex overflow-x-auto pb-1 scrollbar-none">
            {KEYWORD_CATEGORIES.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex-shrink-0"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {KEYWORD_CATEGORIES.map((category) => (
            <TabsContent key={category.id} value={category.id} className="m-0">
              <div className="flex flex-wrap gap-2">
                {filteredKeywords.map((keyword) => (
                  <Badge
                    key={keyword.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleKeywordClick(keyword.text)}
                  >
                    {keyword.text}
                  </Badge>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* 더보기/접기 버튼 */}
      {((simple && SIMPLE_TRENDING_KEYWORDS.length > maxItems) ||
        (!simple && TRENDING_KEYWORDS.filter(k => k.category === activeTab).length > maxItems)) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs w-full flex items-center justify-center"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              접기
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              더 보기
            </>
          )}
        </Button>
      )}
    </Card>
  );
}