// hooks/useFilterState.ts
import { useState, useEffect } from "react";

export interface FilterState {
  cityId: string | null;
  categoryId: string | null;
  cityName: string | null;
  categoryName: string | null;
}

export const FILTER_CHANGE_EVENT = "filterChange";

// Helper function to get cookie safely (client-side only)
const getCookie = (name: string): string | undefined => {
  if (typeof window === "undefined") return undefined;

  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
};

// Helper function to set cookie with expiry
const setCookie = (name: string, value: string, days = 20) => {
  if (typeof window === "undefined") return;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  document.cookie = `${name}=${value}; expires=${expiryDate.toUTCString()}; path=/`;
};

export const useFilterState = () => {
  const [filters, setFilters] = useState<FilterState>({
    cityId: "",
    categoryId: "",
    cityName: "",
    categoryName: "",
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial filters from cookies
  useEffect(() => {
    const initialFilters = {
      cityId: getCookie("selectedCityId") || "",
      categoryId: getCookie("selectedCategoryId") || "",
      cityName: getCookie("selectedCity") || "",
      categoryName: getCookie("selectedCategory") || "",
    };

    setFilters(initialFilters);
    setIsLoaded(true);
  }, []);

  // Update filters and emit change event
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // Update cookies
    if (newFilters.cityId) setCookie("selectedCityId", newFilters.cityId);
    if (newFilters.cityName) setCookie("selectedCity", newFilters.cityName);
    if (newFilters.categoryId)
      setCookie("selectedCategoryId", newFilters.categoryId);
    if (newFilters.categoryName)
      setCookie("selectedCategory", newFilters.categoryName);

    // Emit event for other components
    if (typeof window !== "undefined") {
      const event = new CustomEvent(FILTER_CHANGE_EVENT, {
        detail: updatedFilters,
      });
      document.dispatchEvent(event);
    }
  };

  return {
    filters,
    isLoaded,
    updateFilters,
  };
};

// Hook for components that need to listen to filter changes
export const useFilterListener = (callback: (filters: FilterState) => void) => {
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent<FilterState>) => {
      callback(event.detail);
    };

    // Add event listener
    document.addEventListener(
      FILTER_CHANGE_EVENT,
      handleFilterChange as EventListener
    );

    // Cleanup
    return () => {
      document.removeEventListener(
        FILTER_CHANGE_EVENT,
        handleFilterChange as EventListener
      );
    };
  }, [callback]);
};
