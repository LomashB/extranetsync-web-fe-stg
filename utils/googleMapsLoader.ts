// const DEBUG = false; // Set to true to enable debugging logs

interface GoogleMapsLoaderState {
  isLoaded: boolean;
  isLoading: boolean;
  promise: Promise<void> | null;
  error: Error | null;
}

class GoogleMapsLoader {
  private state: GoogleMapsLoaderState = {
    isLoaded: false,
    isLoading: false,
    promise: null,
    error: null
  };

  async load(): Promise<void> {
    // if (DEBUG) console.log('🗺️ GoogleMapsLoader: Starting load process...');
    
    // If already loaded, return immediately
    if (this.state.isLoaded && window.google?.maps) {
      // if (DEBUG) console.log('✅ GoogleMapsLoader: Already loaded, returning immediately');
      return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (this.state.isLoading && this.state.promise) {
      // if (DEBUG) console.log('⏳ GoogleMapsLoader: Currently loading, returning existing promise');
      return this.state.promise;
    }

    // If there was a previous error, reset and try again
    if (this.state.error) {
      // if (DEBUG) console.log('🔄 GoogleMapsLoader: Previous error found, resetting and retrying');
      this.state.error = null;
    }

    // Start loading
    this.state.isLoading = true;
    this.state.promise = this.loadGoogleMapsScript();

    try {
      await this.state.promise;
      
      // Enhanced verification with detailed logging (debug only)
      // if (DEBUG) console.log('🔍 GoogleMapsLoader: Verifying Google Maps availability...');
      // if (DEBUG) console.log('🔍 window.google exists:', !!window.google);
      // if (DEBUG) console.log('🔍 window.google.maps exists:', !!window.google?.maps);
      // if (DEBUG) console.log('🔍 window.google.maps.Map exists:', !!window.google?.maps?.Map);
      // if (DEBUG) console.log('🔍 window.google.maps.Marker exists:', !!window.google?.maps?.Marker);
      // if (DEBUG) console.log('🔍 window.google.maps.Geocoder exists:', !!window.google?.maps?.Geocoder);
      // if (DEBUG) console.log('🔍 window.google.maps.places exists:', !!window.google?.maps?.places);
      
      if (!window.google?.maps) {
        throw new Error('Google Maps API failed to load properly - window.google.maps not available');
      }
      
      // Verify essential services are available with more specific error messages
      if (!window.google.maps.Map) {
        throw new Error('Google Maps Map service not available - check API key permissions');
      }
      
      if (!window.google.maps.Marker) {
        throw new Error('Google Maps Marker service not available - check API key permissions');
      }
      
      if (!window.google.maps.Geocoder) {
        throw new Error('Google Maps Geocoder service not available - check API key permissions');
      }
      
      // Check if places library loaded (debug only)
      if (!window.google.maps.places?.AutocompleteService) {
        // if (DEBUG) console.log('⚠️ Google Maps Places library not fully loaded - some features may not work');
      }
      
      this.state.isLoaded = true;
      this.state.isLoading = false;
      // if (DEBUG) console.log('✅ GoogleMapsLoader: Successfully loaded and verified!');
    } catch (error) {
      this.state.error = error as Error;
      this.state.isLoading = false;
      this.state.promise = null; // Reset promise for retry
      // console.error('❌ GoogleMapsLoader: Failed to load:', error); // Always log errors
      throw error;
    }
  }

  private async loadGoogleMapsScript(): Promise<void> {
    // Check API key first with better validation
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    // if (DEBUG) console.log('🔑 GoogleMapsLoader: API Key exists:', !!apiKey);
    // if (DEBUG) console.log('🔑 GoogleMapsLoader: API Key length:', apiKey?.length || 0);
    // if (DEBUG) console.log('🔑 GoogleMapsLoader: API Key preview:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
    
    if (!apiKey) {
      throw new Error('Google Maps API key not found. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.');
    }

    if (apiKey.length < 30) {
      // if (DEBUG) console.log('⚠️ GoogleMapsLoader: API key seems too short, might be invalid');
    }

    // Check if Google Maps is already available
    if (window.google?.maps) {
      // if (DEBUG) console.log('✅ GoogleMapsLoader: Google Maps already available on window');
      return Promise.resolve();
    }

    // Check if script is already present
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`) as HTMLScriptElement;
    if (existingScript) {
      // if (DEBUG) console.log('📜 GoogleMapsLoader: Existing script found, waiting for it to load');
      
      // Wait for the existing script to load
      return new Promise((resolve, reject) => {
        if (window.google?.maps) {
          // if (DEBUG) console.log('✅ GoogleMapsLoader: Existing script already loaded');
          resolve();
          return;
        }
        
        let timeoutId: NodeJS.Timeout;
        
        const loadHandler = () => {
          // if (DEBUG) console.log('✅ GoogleMapsLoader: Existing script loaded successfully');
          clearTimeout(timeoutId);
          existingScript.removeEventListener('load', loadHandler);
          existingScript.removeEventListener('error', errorHandler);
          
          // Wait a bit for Google Maps to initialize
          setTimeout(() => {
            if (window.google?.maps) {
              resolve();
            } else {
              reject(new Error('Existing script loaded but Google Maps not available'));
            }
          }, 500);
        };
        
        const errorHandler = (error: Event) => {
          // console.error('❌ GoogleMapsLoader: Existing script failed to load:', error); // Always log errors
          clearTimeout(timeoutId);
          existingScript.removeEventListener('load', loadHandler);
          existingScript.removeEventListener('error', errorHandler);
          reject(new Error('Existing Google Maps script failed to load'));
        };
        
        // Add timeout for existing scripts too
        timeoutId = setTimeout(() => {
          // console.error('❌ GoogleMapsLoader: Existing script load timeout'); // Always log errors
          existingScript.removeEventListener('load', loadHandler);
          existingScript.removeEventListener('error', errorHandler);
          reject(new Error('Existing Google Maps script load timeout'));
        }, 15000);
        
        existingScript.addEventListener('load', loadHandler);
        existingScript.addEventListener('error', errorHandler);
      });
    }

    // Create new script
    // if (DEBUG) console.log('📜 GoogleMapsLoader: Creating new script element');
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=__googleMapsCallback__`;
      
      // if (DEBUG) console.log('🌐 GoogleMapsLoader: Script URL:', scriptUrl.replace(apiKey, '***API_KEY***'));
      
      // Add global callback for more reliable loading
      (window as any).__googleMapsCallback__ = () => {
        // if (DEBUG) console.log('📞 GoogleMapsLoader: Callback fired');
        setTimeout(() => {
          if (window.google?.maps) {
            // if (DEBUG) console.log('✅ GoogleMapsLoader: Google Maps successfully loaded via callback');
            // Clean up callback
            delete (window as any).__googleMapsCallback__;
            resolve();
          } else {
            // console.error('❌ GoogleMapsLoader: Callback fired but Google Maps not available'); // Always log errors
            reject(new Error('Google Maps callback fired but google.maps not available'));
          }
        }, 100);
      };
      
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      
      let timeoutId: NodeJS.Timeout;
      
      script.onload = () => {
        // if (DEBUG) console.log('📜 GoogleMapsLoader: Script onload fired');
        clearTimeout(timeoutId);
        
        // If callback hasn't fired yet, wait a bit more
        if (!window.google?.maps) {
          // if (DEBUG) console.log('📜 GoogleMapsLoader: Script loaded but waiting for initialization...');
          setTimeout(() => {
            if (window.google?.maps) {
              // if (DEBUG) console.log('✅ GoogleMapsLoader: Google Maps available after delay');
              resolve();
            } else {
              // console.error('❌ GoogleMapsLoader: Script loaded but Google Maps still not available'); // Always log errors
              reject(new Error('Google Maps API script loaded but google.maps not available after delay'));
            }
          }, 1000);
        }
      };
      
      script.onerror = (error) => {
        // console.error('❌ GoogleMapsLoader: Script onerror fired:', error); // Always log errors
        clearTimeout(timeoutId);
        // Clean up callback
        delete (window as any).__googleMapsCallback__;
        reject(new Error('Failed to load Google Maps API script - network or API key error'));
      };

      // Add timeout for script loading
      timeoutId = setTimeout(() => {
        // console.error('❌ GoogleMapsLoader: Script load timeout'); // Always log errors
        // Clean up callback
        delete (window as any).__googleMapsCallback__;
        reject(new Error('Google Maps API script load timeout - check network connection'));
      }, 20000); // 20 second timeout

      // if (DEBUG) console.log('📜 GoogleMapsLoader: Appending script to document head');
      document.head.appendChild(script);
    });
  }

  isGoogleMapsLoaded(): boolean {
    const isLoaded = this.state.isLoaded && !!window.google?.maps;
    // if (DEBUG) console.log('🔍 GoogleMapsLoader: isGoogleMapsLoaded check:', isLoaded);
    return isLoaded;
  }

  reset(): void {
    // if (DEBUG) console.log('🔄 GoogleMapsLoader: Resetting state');
    this.state.isLoaded = false;
    this.state.isLoading = false;
    this.state.promise = null;
    this.state.error = null;
    
    // Clean up callback if it exists
    if ((window as any).__googleMapsCallback__) {
      delete (window as any).__googleMapsCallback__;
    }
  }

  // Debug method to check current state
  getDebugInfo() {
    return {
      state: this.state,
      windowGoogle: !!window.google,
      windowGoogleMaps: !!window.google?.maps,
      windowGoogleMapsMap: !!window.google?.maps?.Map,
      windowGoogleMapsGeocoder: !!window.google?.maps?.Geocoder,
      windowGoogleMapsPlaces: !!window.google?.maps?.places,
      apiKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      apiKeyLength: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length || 0,
      existingScript: !!document.querySelector(`script[src*="maps.googleapis.com"]`),
      callback: !!(window as any).__googleMapsCallback__,
    };
  }
}

// Export singleton instance
export const googleMapsLoader = new GoogleMapsLoader();

// Export convenience function
export const loadGoogleMaps = () => googleMapsLoader.load();

// Export debug function
export const getGoogleMapsDebugInfo = () => googleMapsLoader.getDebugInfo(); 