import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps extends React.ComponentProps<typeof Input> {
  onSearchChange?: (value: string) => void;
  debounceDelay?: number;
  showSearchIcon?: boolean;
}

export function SearchInput({
  onSearchChange,
  debounceDelay = 500,
  showSearchIcon = true,
  className = '',
  ...inputProps
}: SearchInputProps) {
  const [searchValue, setSearchValue] = useState(inputProps.value || '');
  const debouncedSearchValue = useDebounce(searchValue, debounceDelay);

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearchValue);
    }
  }, [debouncedSearchValue, onSearchChange]);

  useEffect(() => {
    if (inputProps.value !== undefined) {
      setSearchValue(inputProps.value as string);
    }
  }, [inputProps.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    if (inputProps.onChange) {
      inputProps.onChange(e);
    }
  };

  const inputClassName = showSearchIcon 
    ? `pl-8 ${className}` 
    : className;

  return (
    <div className="relative">
      {showSearchIcon && (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      )}
      <Input
        {...inputProps}
        value={searchValue}
        onChange={handleChange}
        className={inputClassName}
      />
    </div>
  );
} 