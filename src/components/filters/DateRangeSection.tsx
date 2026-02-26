import { DateRangePicker, Slider } from "@heroui/react";
import { useDateFormatter } from "@react-aria/i18n";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
import type { RangeValue, CalendarDate } from "@heroui/react";
import { useEffect, useState } from "react";

interface DateRangeSectionProps {
  dateRangeValue: RangeValue<CalendarDate> | null;
  onDateRangeChange: (range: RangeValue<CalendarDate> | null) => void;
}

const DateRangeSection = ({
  dateRangeValue,
  onDateRangeChange,
}: DateRangeSectionProps) => {
  const formatter = useDateFormatter({ dateStyle: "long" });
  const currentYear = new Date().getFullYear();
  const minYear = 2015;
  const maxDate = parseDate(new Date().toISOString().split("T")[0]);

  // Initialize year range state based on dateRangeValue or defaults
  const [yearRange, setYearRange] = useState<number[]>(() => {
    if (dateRangeValue) {
      return [dateRangeValue.start.year, dateRangeValue.end.year];
    }
    return [minYear, currentYear];
  });

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

  // Fixed type to match what Slider expects
  const handleYearRangeChange = (value: number | number[]) => {
    // Ensure we're working with an array
    const range = Array.isArray(value) ? value : [value, value];
    setYearRange(range);

    const startDate = parseDate(`${range[0]}-01-01`);
    const endDate = parseDate(`${range[1]}-12-31`);

    // Ensure end date doesn't exceed max date
    const adjustedEndDate = endDate.compare(maxDate) > 0 ? maxDate : endDate;

    onDateRangeChange({
      start: startDate,
      end: adjustedEndDate,
    });
  };

  return (
    <div className="w-full flex flex-col gap-y-6">
      <div className="max-w-md">
        <Slider
          label="Year Range"
          minValue={minYear}
          maxValue={currentYear}
          step={1}
          value={yearRange}
          onChange={handleYearRangeChange}
          formatOptions={{
            style: "decimal",
            useGrouping: false,
          }}
        />
        <p className="text-default-500 text-sm mt-1">
          Selected years: {yearRange[0]} - {yearRange[1]}
        </p>
      </div>

      <div className="w-full flex flex-col gap-y-2">
        <DateRangePicker
          className="max-w-sm"
          label="Specific Date Range"
          minValue={parseDate(`${minYear}-01-01`)}
          maxValue={maxDate}
          value={dateRangeValue}
          onChange={onDateRangeChange}
        />
        <p className="text-default-500 text-sm">
          Selected date:{" "}
          {dateRangeValue
            ? formatter.formatRange(
                dateRangeValue.start.toDate(getLocalTimeZone()),
                dateRangeValue.end.toDate(getLocalTimeZone())
              )
            : "--"}
        </p>
      </div>
    </div>
  );
};

export default DateRangeSection;
