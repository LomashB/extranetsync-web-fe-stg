import { useState, useEffect } from "react";

// Helper function to get a specific cookie by name with proper type annotation
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

// Custom hook to get selected city and category IDs from cookies
const useSelectedCityAndCategory = () => {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const cityId: string | null = getCookie("selectedCityId");
    const categoryId: string | null = getCookie("selectedCategoryId");

    setSelectedCityId(cityId);
    setSelectedCategoryId(categoryId);
  }, []);

  return {
    selectedCityId,
    selectedCategoryId,
  };
};

// Function to dynamically generate a URL with query parameters for city and category
export const getUrlWithParams = (baseUrl: string): string => {
  const selectedCityId: string | null = getCookie("selectedCityId");
  const selectedCategoryId: string | null = getCookie("selectedCategoryId");

  // Start with the base URL
  let url = baseUrl;

  // If the URL already has parameters, append with '&'. Otherwise, start with '?'.
  const separator = url.includes("?") ? "&" : "?";

  // Add selectedCityId and selectedCategoryId if they are not null
  if (selectedCityId) {
    url += `${separator}city=${selectedCityId}`;
  }

  if (selectedCategoryId) {
    // Ensure correct separator for the second parameter
    url += `${selectedCityId ? "&" : separator}cat=${selectedCategoryId}`;
  }

  return url;
};

export default useSelectedCityAndCategory;