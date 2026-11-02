import * as React from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { getMonthNames } from '@/lib/date-utils';

interface DatePickerProps {
    value?: Date | string;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    id?: string;
    name?: string;
    onBlur?: () => void;
    disabled?: boolean;
    fromYear?: number;
    toYear?: number;
    yearOnly?: boolean;
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'Pick a date',
    id,
    name,
    onBlur,
    disabled,
    fromYear = 1960,
    toYear = new Date().getFullYear() + 10,
    yearOnly = false,
}: DatePickerProps) {
    // Re-render on language change so month names update
    useTranslation();
    const months = getMonthNames('long');
    const monthsShort = getMonthNames('short');

    // Convert string value to Date if needed
    const dateValue = React.useMemo(() => {
        if (!value) return undefined;
        if (value instanceof Date) return value;
        if (typeof value === 'string' && value) {
            // Try to parse as ISO string first
            const isoDate = new Date(value);
            if (!isNaN(isoDate.getTime())) {
                return isoDate;
            }
            // Fallback: Handle YYYY-MM format
            const [year, month] = value.split('-').map(Number);
            if (year && month) {
                return new Date(year, month - 1, 1);
            }
        }
        return undefined;
    }, [value]);

    const [selectedMonth, setSelectedMonth] = React.useState(
        dateValue ? dateValue.getMonth() : new Date().getMonth(),
    );
    const [selectedYear, setSelectedYear] = React.useState(
        dateValue ? dateValue.getFullYear() : new Date().getFullYear(),
    );
    const [isOpen, setIsOpen] = React.useState(false);

    // Update selected month/year when value changes
    const [prevDateValue, setPrevDateValue] = React.useState(dateValue);
    if (dateValue?.getTime() !== prevDateValue?.getTime()) {
        setPrevDateValue(dateValue);
        if (dateValue) {
            setSelectedMonth(dateValue.getMonth());
            setSelectedYear(dateValue.getFullYear());
        }
    }

    const handleMonthSelect = (month: number) => {
        const newDate = new Date(Date.UTC(selectedYear, month, 1));
        onChange?.(newDate);
        setIsOpen(false);
    };

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        // In yearOnly mode, select the year immediately
        if (yearOnly) {
            const newDate = new Date(Date.UTC(year, 0, 1));
            onChange?.(newDate);
            setIsOpen(false);
        }
        // Don't close the popover when changing year in month+year mode
    };

    const incrementYear = () => {
        if (selectedYear < toYear) {
            const newYear = selectedYear + 1;
            setSelectedYear(newYear);
            if (yearOnly) {
                const newDate = new Date(Date.UTC(newYear, 0, 1));
                onChange?.(newDate);
                setIsOpen(false);
            }
        }
    };

    const decrementYear = () => {
        if (selectedYear > fromYear) {
            const newYear = selectedYear - 1;
            setSelectedYear(newYear);
            if (yearOnly) {
                const newDate = new Date(Date.UTC(newYear, 0, 1));
                onChange?.(newDate);
                setIsOpen(false);
            }
        }
    };

    const formatDisplay = () => {
        if (dateValue) {
            if (yearOnly) {
                return dateValue.getFullYear().toString();
            }
            return `${months[dateValue.getMonth()]} ${dateValue.getFullYear()}`;
        }
        return placeholder;
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    name={name}
                    variant='outline'
                    className={cn(
                        'border-input w-full justify-start text-left font-normal',
                        !dateValue && 'text-muted-foreground',
                    )}
                    onBlur={onBlur}
                    disabled={disabled}
                    type='button'
                >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    <span>{formatDisplay()}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-4' align='start'>
                <div className='space-y-4'>
                    {/* Year selector */}
                    <div className='flex items-center justify-between'>
                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={decrementYear}
                            disabled={selectedYear <= fromYear}
                            type='button'
                        >
                            <ChevronLeft className='h-4 w-4' />
                        </Button>
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(value) => handleYearChange(Number(value))}
                        >
                            <SelectTrigger className='w-32'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from(
                                    { length: toYear - fromYear + 1 },
                                    (_, i) => fromYear + i,
                                ).map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={incrementYear}
                            disabled={selectedYear >= toYear}
                            type='button'
                        >
                            <ChevronRight className='h-4 w-4' />
                        </Button>
                    </div>

                    {/* Month grid - only shown when not in yearOnly mode */}
                    {!yearOnly && (
                        <div className='grid grid-cols-3 gap-2'>
                            {monthsShort.map((month, index) => (
                                <Button
                                    key={index}
                                    variant={
                                        selectedMonth === index && dateValue ? 'default' : 'outline'
                                    }
                                    size='sm'
                                    onClick={() => handleMonthSelect(index)}
                                    className='h-9'
                                    type='button'
                                >
                                    {month}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
