import { Fragment, useState } from 'react';
import { Combobox as HeadlessCombobox } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: Option[];
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
}

export default function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  multiple = false,
}: ComboboxProps) {
  const [query, setQuery] = useState('');

  const filteredOptions = query === ''
    ? options
    : options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));

  const getDisplayValue = () => {
    if (Array.isArray(value)) {
      return value.map((v) => options.find((o) => o.value === v)?.label).join(', ');
    }
    return options.find((option) => option.value === value)?.label || '';
  };

  return (
    <HeadlessCombobox value={value} onChange={onChange} multiple={multiple}>
      <div className="relative">
        <div className="relative w-full cursor-default overflow-hidden rounded-md border border-input bg-background text-left focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <HeadlessCombobox.Input
            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-foreground focus:ring-0"
            displayValue={getDisplayValue}
            placeholder={placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          <HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </HeadlessCombobox.Button>
        </div>

        <HeadlessCombobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
          {filteredOptions.map((option) => (
            <HeadlessCombobox.Option
              key={option.value}
              value={option.value}
              as={Fragment}
            >
              {({ active, selected }) => (
                <li
                  className={`relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                  }`}
                >
                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                    {option.label}
                  </span>
                  {selected && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-foreground">
                      <Check className="h-5 w-5" />
                    </span>
                  )}
                </li>
              )}
            </HeadlessCombobox.Option>
          ))}
        </HeadlessCombobox.Options>
      </div>
    </HeadlessCombobox>
  );
}
