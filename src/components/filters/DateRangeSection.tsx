"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarDate, parseDate } from "@internationalized/date";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRangeValue } from "@/stores/filterStore";

interface DateRangeSectionProps {
  dateRangeValue: DateRangeValue | null;
  onDateRangeChange: (range: DateRangeValue | null) => void;
}

// Boundary conversions between the store's CalendarDate model and
// react-day-picker's native Date-based DateRange. The stored shape never
// changes — these only translate at the picker UI edge.
const calendarDateToDate = (date: CalendarDate): Date =>
  new Date(date.year, date.month - 1, date.day);

const dateToCalendarDate = (date: Date): CalendarDate =>
  new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

const toDateRange = (value: DateRangeValue | null): DateRange | undefined =>
  value
    ? {
        from: calendarDateToDate(value.start),
        to: calendarDateToDate(value.end),
      }
    : undefined;

const DateRangeSection = ({
  dateRangeValue,
  onDateRangeChange,
}: DateRangeSectionProps) => {
  const formatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "long" }),
    []
  );

  const currentYear = new Date().getFullYear();
  const minYear = 2015;

  // Preserve the original CalendarDate min/max so the year-slider clamp logic
  // stays byte-for-byte identical to the HeroUI version.
  const minCalendarDate = parseDate(`${minYear}-01-01`);
  const maxCalendarDate = parseDate(new Date().toISOString().split("T")[0]);
  const minDate = calendarDateToDate(minCalendarDate);
  const maxDate = calendarDateToDate(maxCalendarDate);

  const [open, setOpen] = useState(false);

  // Initialize year range state based on dateRangeValue or defaults
  const [yearRange, setYearRange] = useState<number[]>(() => {
    if (dateRangeValue) {
      return [dateRangeValue.start.year, dateRangeValue.end.year];
    }
    return [minYear, currentYear];
  });

  // Draft range drives the Calendar so an in-progress (start-only) selection is
  // visible before both ends are chosen and committed to the store.
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(() =>
    toDateRange(dateRangeValue)
  );

  // Update year range when dateRangeValue changes
  useEffect(() => {
    if (dateRangeValue) {
      const startYear = dateRangeValue.start.year;
      const endYear = dateRangeValue.end.year;

      // Only update if years are different to avoid infinite loop
      if (startYear !== yearRange[0] || endYear !== yearRange[1]) {
        setYearRange([startYear, endYear]);
      }
    }
  }, [dateRangeValue]);

  // Keep the Calendar selection in sync with external store updates.
  useEffect(() => {
    setDraftRange(toDateRange(dateRangeValue));
  }, [dateRangeValue]);

  const handleYearRangeChange = (value: number | number[]) => {
    // Ensure we're working with an array
    const range = Array.isArray(value) ? value : [value, value];
    setYearRange(range);

    const startDate = parseDate(`${range[0]}-01-01`);
    const endDate = parseDate(`${range[1]}-12-31`);

    // Ensure end date doesn't exceed max date
    const adjustedEndDate =
      endDate.compare(maxCalendarDate) > 0 ? maxCalendarDate : endDate;

    onDateRangeChange({
      start: startDate,
      end: adjustedEndDate,
    });
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setDraftRange(range);

    if (range?.from && range?.to) {
      onDateRangeChange({
        start: dateToCalendarDate(range.from),
        end: dateToCalendarDate(range.to),
      });
      setOpen(false);
    } else if (!range?.from && !range?.to) {
      onDateRangeChange(null);
    }
    // A start-only selection stays local until the end date is picked.
  };

  return (
    <div className="w-full flex flex-col gap-y-6">
      <div className="max-w-md flex flex-col gap-y-2">
        <Label>Year Range</Label>
        <Slider
          min={minYear}
          max={currentYear}
          step={1}
          value={yearRange}
          onValueChange={handleYearRangeChange}
          aria-label="Year Range"
        />
        <p className="text-muted-foreground text-sm">
          Selected years: {yearRange[0]} - {yearRange[1]}
        </p>
      </div>

      <div className="w-full flex flex-col gap-y-2 max-w-sm">
        <Label>Specific Date Range</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRangeValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon />
              {dateRangeValue
                ? formatter.formatRange(
                    calendarDateToDate(dateRangeValue.start),
                    calendarDateToDate(dateRangeValue.end)
                  )
                : "Pick a date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              captionLayout="dropdown"
              defaultMonth={draftRange?.from ?? maxDate}
              startMonth={minDate}
              endMonth={maxDate}
              disabled={{ before: minDate, after: maxDate }}
              selected={draftRange}
              onSelect={handleCalendarSelect}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-muted-foreground text-sm">
          Selected date:{" "}
          {dateRangeValue
            ? formatter.formatRange(
                calendarDateToDate(dateRangeValue.start),
                calendarDateToDate(dateRangeValue.end)
              )
            : "--"}
        </p>
      </div>
    </div>
  );
};

export default DateRangeSection;
