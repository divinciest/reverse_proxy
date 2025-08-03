import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/utils/api';
import { configService } from '@/utils/services/configService'; import { Badge } from '@/components/ui/badge';

interface ClientLocationInfo {
    client_ip: string;
    country_code: string | null;
    country_name: string | null;
    country_tag_name: string | null;
    error: string | null;
}

const CurrentCountryDisplay: React.FC = () => {
  const [displayCountry, setDisplayCountry] = useState<string | null>(null);
  const [source, setSource] = useState<string>(''); // e.g., "Detected", "Default", "Disabled"
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountryInfo = async () => {
      setIsLoading(true);
      setError(null);
      setDisplayCountry(null);
      setSource('');

      try {
        const biasConfig = await configService.getClientGeographicBiasConfig();

        if (!biasConfig.enableGeographicBias) {
          setDisplayCountry('Geographic bias disabled');
          setSource('Configuration');
          setIsLoading(false);
          return;
        }

        let finalCountryTag: string | null = null;
        let finalSource: string = 'Default';

        if (biasConfig.autoDetectLocation) {
          try {
            const response = await api.get<ClientLocationInfo>('/get_client_location_info');
            const locationData = response.data;

            if (locationData.error && !locationData.country_tag_name) {
              console.warn('Error detecting location, falling back to default:', locationData.error);
              // Fallback to default if detection fails but bias is on
              finalCountryTag = biasConfig.defaultCountryTag;
              finalSource = 'Default (detection failed)';
            } else if (locationData.country_tag_name) {
              finalCountryTag = locationData.country_tag_name;
              finalSource = 'Detected';
            } else {
              // No tag detected, use default
              finalCountryTag = biasConfig.defaultCountryTag;
              finalSource = 'Default (no specific detection)';
            }
          } catch (locError: any) {
            console.error('API error fetching client location:', locError.response?.data || locError.message);
            // Fallback to default on API error
            finalCountryTag = biasConfig.defaultCountryTag;
            finalSource = 'Default (detection API error)';
          }
        } else {
          // Auto-detection is off, use default
          finalCountryTag = biasConfig.defaultCountryTag;
          finalSource = 'Default (auto-detect off)';
        }

        setDisplayCountry(finalCountryTag?.toLowerCase() || 'Not specified');
        setSource(finalSource);
      } catch (configError: any) {
        console.error('Error fetching geographic bias config:', configError.message);
        setError('Could not load geographic settings.');
        setDisplayCountry('Error');
        setSource('Error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountryInfo();
  }, []);

  return (
    <div className="p-3 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-sm font-medium mb-2 flex items-center text-gray-700 dark:text-gray-300">
        <MapPin size={16} className="mr-1.5 text-blue-500" />
        Content Region
      </h3>
      {isLoading && (
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Loader2 size={14} className="animate-spin mr-2" />
          Determining region...
        </div>
      )}
      {error && !isLoading && (
        <div className="flex items-center text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={14} className="mr-2" />
          {error}
        </div>
      )}
      {!isLoading && !error && displayCountry && (
        <div className="text-xs">
          <Badge variant={source === 'Detected' ? 'default' : 'secondary'} className="capitalize">
            {displayCountry}
          </Badge>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            (Source:
            {' '}
            {source}
            )
          </p>
        </div>
      )}
      {!isLoading && !error && !displayCountry && (
      <p className="text-xs text-gray-500 dark:text-gray-400">Region not available.</p>
      )}
    </div>
  );
};

export default CurrentCountryDisplay;
