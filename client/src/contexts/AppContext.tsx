import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductStatus, DEFAULT_COUNTRY, API_ROUTES, View } from "@/lib/constants";
import type { Country, Product, UserProduct } from "@shared/schema";

type AppContextType = {
  currentView: View;
  setCurrentView: (view: View) => void;
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  toggleCategory: (category: string) => void;
  isAllCategoriesSelected: boolean;
  currentProductIndex: number;
  setCurrentProductIndex: (index: number) => void;
  isShareModalOpen: boolean;
  openShareModal: () => void;
  closeShareModal: () => void;
  shareUrl: string | null;
  setShareUrl: (url: string | null) => void;
  generateShareUrl: (status?: ProductStatus) => void;
  exchangeRate: number | null;
  lastUpdated: string | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  
  // App state
  const [currentView, setCurrentView] = useState<View>(View.EXPLORE);
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["ALL"]);
  const [currentProductIndex, setCurrentProductIndex] = useState<number>(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Derived state
  const isAllCategoriesSelected = selectedCategories.includes("ALL");

  // Category management functions
  const addCategory = (category: string) => {
    if (category === "ALL") {
      setSelectedCategories(["ALL"]);
    } else {
      setSelectedCategories(prev => {
        const newCategories = prev.filter(c => c !== "ALL");
        if (!newCategories.includes(category)) {
          return [...newCategories, category];
        }
        return newCategories;
      });
    }
  };

  const removeCategory = (category: string) => {
    if (category === "ALL") {
      if (selectedCategories.length <= 1) {
        return; // Don't remove the last category
      }
      setSelectedCategories(prev => prev.filter(c => c !== "ALL"));
    } else {
      setSelectedCategories(prev => {
        const newCategories = prev.filter(c => c !== category);
        if (newCategories.length === 0) {
          return ["ALL"]; // If no categories are selected, select ALL
        }
        return newCategories;
      });
    }
  };

  const toggleCategory = (category: string) => {
    console.log("In AppContext toggleCategory:", category);
    if (selectedCategories.includes(category)) {
      console.log("Removing category:", category);
      removeCategory(category);
    } else {
      console.log("Adding category:", category);
      addCategory(category);
    }
    // Log after the state update was requested
    setTimeout(() => {
      console.log("selectedCategories after toggle request:", selectedCategories);
    }, 0);
  };

  // Get exchange rate
  const { data: exchangeRateData } = useQuery({
    queryKey: [API_ROUTES.CURRENCY, selectedCountry.currency],
    enabled: !!selectedCountry
  });

  // Update exchange rate when data changes
  useEffect(() => {
    if (exchangeRateData) {
      setExchangeRate(exchangeRateData.rate);
      setLastUpdated(exchangeRateData.lastUpdated);
    }
  }, [exchangeRateData]);

  // Share modal functions
  const openShareModal = () => setIsShareModalOpen(true);
  const closeShareModal = () => setIsShareModalOpen(false);

  // Generate share URL
  const generateShareUrl = async (status?: ProductStatus) => {
    try {
      const response = await fetch(`${API_ROUTES.SHARED_LIST}${status ? `?status=${status}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ countryId: selectedCountry.id })
      });
      
      if (!response.ok) throw new Error('Failed to generate share URL');
      
      const data = await response.json();
      setShareUrl(data.shareUrl);
      openShareModal();
    } catch (error) {
      console.error('Error generating share URL:', error);
    }
  };

  const value = {
    currentView,
    setCurrentView,
    selectedCountry,
    setSelectedCountry,
    selectedCategories,
    setSelectedCategories,
    addCategory,
    removeCategory,
    toggleCategory,
    isAllCategoriesSelected,
    currentProductIndex,
    setCurrentProductIndex,
    isShareModalOpen,
    openShareModal,
    closeShareModal,
    shareUrl,
    setShareUrl,
    generateShareUrl,
    exchangeRate,
    lastUpdated
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
